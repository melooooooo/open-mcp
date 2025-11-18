import path from 'path'
import dotenv from 'dotenv'
import pg from 'pg'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import https from 'https'
import http from 'http'

dotenv.config({ path: path.resolve('.env.local') })
delete process.env.HTTP_PROXY
delete process.env.HTTPS_PROXY

const { Client } = pg

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

// 新增站点数据
const newSites = [
  {
    title: '国聘网',
    company_name: '国聘',
    description: '国资委旗下招聘平台，专注央企国企优质岗位，权威可靠。',
    website_url: 'https://www.iguopin.com/',
    company_size: '平台',
    department: '国资委旗下招聘平台，专注央企国企优质岗位，权威可靠。',
    location: ['全国'],
    job_type: 'fulltime',
    tags: ['fulltime', 'state-owned'],
    is_hot: true,
    is_new: true,
    has_referral: false,
    seo_name: 'guopin-jobs-logo',
  },
  {
    title: '水木社区',
    company_name: '水木社区',
    description: '清华大学BBS招聘版块，高质量技术岗位，互联网公司内推多。',
    website_url: 'https://www.newsmth.net/',
    company_size: '社区',
    department: '清华大学BBS招聘版块，高质量技术岗位，互联网公司内推多。',
    location: ['全国'],
    job_type: 'fulltime',
    tags: ['fulltime', 'tech', 'referral'],
    is_hot: false,
    is_new: true,
    has_referral: true,
    seo_name: 'newsmth-bbs-jobs-logo',
  },
]

// 下载图片
function downloadImage(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    
    protocol.get(url, { timeout: 10000 }, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects > 0) {
          const redirectUrl = new URL(res.headers.location, url).href
          return downloadImage(redirectUrl, maxRedirects - 1)
            .then(resolve)
            .catch(reject)
        } else {
          return reject(new Error('Too many redirects'))
        }
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`))
      }

      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

// 获取 favicon
async function getFavicon(websiteUrl, seoName) {
  const hostname = new URL(websiteUrl).hostname
  
  // 尝试多个 favicon 源
  const candidates = [
    `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
    `https://icons.duckduckgo.com/ip2/${hostname}.ico`,
    `${websiteUrl}favicon.ico`,
  ]

  for (const url of candidates) {
    try {
      console.log(`  Trying: ${url}`)
      const imageBuffer = await downloadImage(url)
      
      if (imageBuffer.length > 100) {
        console.log(`  ✓ Downloaded: ${imageBuffer.length} bytes`)
        return imageBuffer
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`)
    }
  }

  throw new Error('Could not download favicon from any source')
}

async function main() {
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await dbClient.connect()
    console.log('Connected to database\n')

    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL
    const BUCKET_NAME = process.env.R2_BUCKET_NAME

    for (const site of newSites) {
      console.log(`\n=== Processing: ${site.title} ===`)
      
      // 检查是否已存在
      const existing = await dbClient.query(
        'SELECT id FROM career_platform.job_sites WHERE title = $1',
        [site.title]
      )

      if (existing.rows.length > 0) {
        console.log(`⚠ Site already exists, skipping...`)
        continue
      }

      try {
        // 下载 favicon
        console.log('Downloading favicon...')
        const imageBuffer = await getFavicon(site.website_url, site.seo_name)

        // 上传到 R2
        const r2Key = `logos/${site.seo_name}.png`
        console.log(`Uploading to R2: ${r2Key}`)
        
        await r2Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: r2Key,
          Body: imageBuffer,
          ContentType: 'image/png',
        }))

        const logoUrl = `${R2_PUBLIC_URL}/${r2Key}`
        console.log(`✓ Uploaded: ${logoUrl}`)

        // 插入数据库
        const { seo_name, ...siteData } = site
        await dbClient.query(
          `INSERT INTO career_platform.job_sites (
            title, company_name, description, website_url, company_logo,
            company_size, department, location, job_type, tags,
            is_hot, is_new, has_referral, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
          [
            siteData.title,
            siteData.company_name,
            siteData.description,
            siteData.website_url,
            logoUrl,
            siteData.company_size,
            siteData.department,
            siteData.location,
            siteData.job_type,
            siteData.tags,
            siteData.is_hot,
            siteData.is_new,
            siteData.has_referral,
          ]
        )

        console.log(`✅ Successfully added: ${site.title}`)

      } catch (error) {
        console.error(`❌ Failed to add ${site.title}: ${error.message}`)
      }
    }

    console.log('\n=== Summary ===')
    console.log('New sites have been added to the database!')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await dbClient.end()
  }
}

main()

