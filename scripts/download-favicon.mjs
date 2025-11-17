import fs from 'fs'
import { chromium } from 'playwright'

const [,, inputFile, outputFile] = process.argv
if (!inputFile || !outputFile) {
  console.error('Usage: node scripts/download-favicon.mjs input.json output.json')
  process.exit(1)
}

const targets = JSON.parse(fs.readFileSync(inputFile, 'utf8'))
const results = []

const fallback = (url) => {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
  } catch {
    return null
  }
}

async function detectFavicon(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 })
    const domainIcon = await page.evaluate(() => {
      const link = document.querySelector('link[rel~="icon" i]') || document.querySelector('link[rel~="shortcut" i]')
      return link ? link.href : null
    })
    return domainIcon
  } catch (err) {
    console.error('navigate error', url, err.message)
    return null
  }
}

(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  for (const site of targets) {
    const { id, title, website_url: websiteUrl } = site
    let iconUrl = fallback(websiteUrl)
    let fromPage = false

    const candidate = await detectFavicon(page, websiteUrl)
    if (candidate) {
      iconUrl = candidate
      fromPage = true
    }

    results.push({ id, title, websiteUrl, iconUrl, fromPage })
  }

  await browser.close()
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2))
})()
