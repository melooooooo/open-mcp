import fs from 'fs'
import https from 'https'
import http from 'http'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve('.env.local') })
delete process.env.HTTP_PROXY
delete process.env.HTTPS_PROXY
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const targets = JSON.parse(fs.readFileSync('/tmp/all-logos.json','utf8'))
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const fetchImage = (url, redirectCount = 0) => new Promise((resolve, reject) => {
  const client = url.startsWith('https') ? https : http
  client.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectCount < 5) {
      const location = new URL(res.headers.location, url).toString()
      resolve(fetchImage(location, redirectCount + 1))
      return
    }
    if (res.statusCode !== 200) {
      reject(new Error(`HTTP ${res.statusCode}`))
      return
    }
    const chunks = []
    res.on('data', (chunk) => chunks.push(chunk))
    res.on('end', () => resolve(Buffer.concat(chunks)))
  }).on('error', reject)
})

const uploads = []
for (const site of targets) {
  uploads.push((async () => {
    const { id, title, currentLogo, url } = site
    try {
      const hostname = (() => {
        try {
          return new URL(url || currentLogo).hostname
        } catch {
          return null
        }
      })()
      const candidates = [currentLogo]
      if (hostname) {
        candidates.push(`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`)
        candidates.push(`https://icons.duckduckgo.com/ip2/${hostname}.ico`)
      }
      let buffer
      let lastError
      for (const candidate of candidates) {
        if (!candidate) continue
        try {
          buffer = await fetchImage(candidate)
          break
        } catch (err) {
          lastError = err
        }
      }
      if (!buffer) throw lastError || new Error('No icon candidates available')
      const key = `logos/${id}.png`
      await client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
      }))
      console.log('Uploaded', title, key)
      return { id, key }
    } catch (error) {
      console.error('Failed', title, error.message)
      return { id, error: error.message }
    }
  })())
}

const results = await Promise.all(uploads)
fs.writeFileSync('/tmp/r2-upload-results.json', JSON.stringify(results, null, 2))
