import fs from "node:fs/promises"
import path from "node:path"

import { chromium } from "playwright"

const candidateUrl = (process.env.CANDIDATE_URL || "http://localhost:30001").replace(/\/$/, "")
const baselineUrl = process.env.BASELINE_URL?.replace(/\/$/, "") || null
const outputRoot = path.resolve(
  process.cwd(),
  process.env.SCREENSHOT_DIR || "apps/web/e2e/artifacts/experience-rendering"
)

function safeFilename(value) {
  return value.replace(/[\\/:*?"<>|]/g, "-").slice(0, 120)
}

async function getExperienceSlugs() {
  const response = await fetch(`${candidateUrl}/api/mp/experiences?page=1&pageSize=50`)
  if (!response.ok) throw new Error(`Experience list failed: ${response.status}`)
  const body = await response.json()
  if (body.code !== "OK" || !Array.isArray(body.data?.items)) {
    throw new Error("Experience list returned an unexpected response")
  }
  return body.data.items.map((item) => item.slug).filter(Boolean)
}

async function capture(browser, baseUrl, label, slugs) {
  const directory = path.join(outputRoot, label)
  await fs.mkdir(directory, { recursive: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const results = []

  for (const slug of slugs) {
    const url = `${baseUrl}/experiences/${encodeURIComponent(slug)}`
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 })
    const status = response?.status() || 0
    const filename = `${safeFilename(slug)}.png`
    await page.screenshot({ path: path.join(directory, filename), fullPage: true })
    results.push({ slug, url, status, filename })
  }

  await page.close()
  return results
}

const browser = await chromium.launch({ headless: true })
try {
  const slugs = await getExperienceSlugs()
  if (slugs.length !== 50) {
    throw new Error(`Expected 50 experiences, received ${slugs.length}`)
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    baselineUrl,
    candidateUrl,
    baseline: baselineUrl ? await capture(browser, baselineUrl, "baseline", slugs) : [],
    candidate: await capture(browser, candidateUrl, "candidate", slugs),
  }
  await fs.mkdir(outputRoot, { recursive: true })
  await fs.writeFile(
    path.join(outputRoot, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  )

  const failures = [...manifest.baseline, ...manifest.candidate].filter(
    (item) => item.status < 200 || item.status >= 400
  )
  if (failures.length) {
    throw new Error(`${failures.length} experience pages failed during capture`)
  }
  console.log(`Captured ${slugs.length} experience pages in ${outputRoot}`)
} finally {
  await browser.close()
}
