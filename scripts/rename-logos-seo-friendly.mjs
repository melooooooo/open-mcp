import path from 'path'
import dotenv from 'dotenv'
import pg from 'pg'
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

dotenv.config({ path: path.resolve('.env.local') })
delete process.env.HTTP_PROXY
delete process.env.HTTPS_PROXY

const { Client } = pg

// SEO 友好的文件名映射
const seoNameMapping = {
  'BOSS直聘': 'boss-zhipin-logo',
  'JobLeap.cn': 'jobleap-logo',
  'UI中国招聘': 'ui-china-jobs-logo',
  '前程无忧 (51Job)': '51job-qianchengwuyou-logo',
  '北邮人导航招聘': 'byr-navi-jobs-logo',
  '国家大学生就业服务平台': 'ncss-china-jobs-logo',
  '国资央企招聘平台': 'guopin-state-owned-jobs-logo',
  '实习僧': 'shixiseng-internship-logo',
  '就业在线': 'jobonline-logo',
  '应届生求职网': 'yingjiesheng-graduate-jobs-logo',
  '拉勾招聘': 'lagou-jobs-logo',
  '斗米': 'doumi-jobs-logo',
  '智联招聘': 'zhaopin-zhilian-logo',
  '牛客网招聘': 'nowcoder-jobs-logo',
  '猎聘 (Liepin)': 'liepin-jobs-logo',
  '脉脉': 'maimai-jobs-logo',
  '赶集网': 'ganji-jobs-logo',
  '鱼泡网': 'yupao-jobs-logo',
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

async function main() {
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await dbClient.connect()
    console.log('Connected to database\n')

    // 查询所有 R2 托管的站点
    const result = await dbClient.query(`
      SELECT id, title, company_logo
      FROM career_platform.job_sites
      WHERE company_logo LIKE '%store.yinhangbang.com%'
      ORDER BY title
    `)

    console.log(`Found ${result.rows.length} sites with R2 logos\n`)

    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL
    const BUCKET_NAME = process.env.R2_BUCKET_NAME

    let renamed = 0
    let skipped = 0
    let errors = 0

    for (const row of result.rows) {
      const { id, title, company_logo } = row
      const seoName = seoNameMapping[title]

      if (!seoName) {
        console.log(`⚠ Skipping ${title} - no SEO name mapping`)
        skipped++
        continue
      }

      try {
        // 提取旧的 key
        const oldKey = company_logo.replace(`${R2_PUBLIC_URL}/`, '')
        const newKey = `logos/${seoName}.png`

        console.log(`Processing: ${title}`)
        console.log(`  Old: ${oldKey}`)
        console.log(`  New: ${newKey}`)

        // 在 R2 中复制文件到新名称
        await r2Client.send(new CopyObjectCommand({
          Bucket: BUCKET_NAME,
          CopySource: `${BUCKET_NAME}/${oldKey}`,
          Key: newKey,
          ContentType: 'image/png',
        }))

        // 删除旧文件
        await r2Client.send(new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: oldKey,
        }))

        // 更新数据库
        const newLogoUrl = `${R2_PUBLIC_URL}/${newKey}`
        await dbClient.query(
          `UPDATE career_platform.job_sites 
           SET company_logo = $1, updated_at = NOW()
           WHERE id = $2`,
          [newLogoUrl, id]
        )

        console.log(`  ✓ Renamed and updated: ${newLogoUrl}\n`)
        renamed++

      } catch (error) {
        console.error(`  ✗ Failed: ${error.message}\n`)
        errors++
      }
    }

    console.log('\n=== Rename Summary ===')
    console.log(`Total sites: ${result.rows.length}`)
    console.log(`✓ Successfully renamed: ${renamed}`)
    console.log(`⚠ Skipped: ${skipped}`)
    console.log(`✗ Errors: ${errors}`)

    if (renamed > 0) {
      console.log('\n✅ Logo files have been renamed with SEO-friendly names!')
      console.log('Database has been updated with new URLs.')
    }

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await dbClient.end()
  }
}

main()

