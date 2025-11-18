import fs from 'fs'
import https from 'https'
import http from 'http'
import path from 'path'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: path.resolve('.env.local') })
delete process.env.HTTP_PROXY
delete process.env.HTTPS_PROXY

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const { Client } = pg

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const fetchImage = (url, redirectCount = 0) => new Promise((resolve, reject) => {
  const httpClient = url.startsWith('https') ? https : http
  httpClient.get(url, (res) => {
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

// 失败的站点列表
const failedSites = [
  {
    id: "8543509b-32e5-45a1-afa9-a93c41024c6b",
    title: "领英 (LinkedIn)",
    url: "https://www.linkedin.com.cn"
  },
  {
    id: "73d4358c-c888-45f6-96c9-b358ecb079d0",
    title: "脉脉",
    url: "https://www.maimai.cn"
  },
  {
    id: "1200790f-032e-4ecb-941b-cdaeb36166a2",
    title: "中国公共招聘网",
    url: "https://www.chinajob.mohrss.gov.cn"
  },
  {
    id: "d0e2b961-0091-4601-aebb-d6e1a7795b0e",
    title: "海投网",
    url: "https://www.haitouwang.com"
  },
  {
    id: "4b97aae1-dca2-4289-add6-f82c133bcb00",
    title: "兼职猫",
    url: "https://www.jianzhimao.com"
  }
]

async function main() {
  const results = []
  
  for (const site of failedSites) {
    const { id, title, url } = site
    try {
      const hostname = new URL(url).hostname
      
      // 尝试多个 favicon 源
      const candidates = [
        `https://icons.duckduckgo.com/ip2/${hostname}.ico`,
        `https://www.google.com/s2/favicons?domain=${hostname}&sz=256`,
        `https://${hostname}/favicon.ico`,
      ]
      
      let buffer
      let lastError
      let usedSource
      
      for (const candidate of candidates) {
        try {
          console.log(`Trying ${title}: ${candidate}`)
          buffer = await fetchImage(candidate)
          usedSource = candidate
          break
        } catch (err) {
          lastError = err
          console.log(`  Failed: ${err.message}`)
        }
      }
      
      if (!buffer) {
        throw lastError || new Error('No icon candidates available')
      }
      
      const key = `logos/${id}.png`
      await client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
      }))
      
      console.log(`✓ Uploaded ${title} from ${usedSource}`)
      results.push({ id, title, key, source: usedSource })
      
    } catch (error) {
      console.error(`✗ Failed ${title}:`, error.message)
      results.push({ id, title, error: error.message })
    }
  }
  
  // 更新数据库
  const successful = results.filter(r => r.key && !r.error)
  if (successful.length > 0) {
    const dbClient = new Client({
      connectionString: process.env.DATABASE_URL,
    })
    
    try {
      await dbClient.connect()
      const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL
      
      for (const result of successful) {
        const { id, key, title } = result
        const newLogoUrl = `${R2_PUBLIC_URL}/${key}`
        
        await dbClient.query(
          `UPDATE career_platform.job_sites 
           SET company_logo = $1, updated_at = NOW()
           WHERE id = $2`,
          [newLogoUrl, id]
        )
        
        console.log(`✓ Updated DB for ${title}: ${newLogoUrl}`)
      }
      
      await dbClient.end()
    } catch (error) {
      console.error('Database update error:', error)
    }
  }
  
  console.log('\n=== Retry Summary ===')
  console.log(`Total: ${failedSites.length}`)
  console.log(`Successful: ${successful.length}`)
  console.log(`Failed: ${results.filter(r => r.error).length}`)
}

main()

