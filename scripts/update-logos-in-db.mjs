import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: path.resolve('.env.local') })

const { Client } = pg

async function main() {
  // 读取上传结果
  const resultsPath = '/tmp/r2-upload-results.json'
  if (!fs.existsSync(resultsPath)) {
    console.error(`Results file not found: ${resultsPath}`)
    console.error('Please run migrate-logos-to-r2.mjs first')
    process.exit(1)
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
  console.log(`Found ${results.length} upload results`)

  // 统计成功和失败的数量
  const successful = results.filter(r => r.key && !r.error)
  const failed = results.filter(r => r.error)
  console.log(`Successful: ${successful.length}, Failed: ${failed.length}`)

  if (successful.length === 0) {
    console.log('No successful uploads to update')
    return
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Connected to database')

    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL
    if (!R2_PUBLIC_URL) {
      throw new Error('R2_PUBLIC_URL not found in environment variables')
    }

    let updated = 0
    let errors = 0

    // 批量更新
    for (const result of successful) {
      const { id, key } = result
      const newLogoUrl = `${R2_PUBLIC_URL}/${key}`

      try {
        const updateResult = await client.query(
          `UPDATE career_platform.job_sites 
           SET company_logo = $1, updated_at = NOW()
           WHERE id = $2`,
          [newLogoUrl, id]
        )

        if (updateResult.rowCount > 0) {
          updated++
          console.log(`✓ Updated ${id}: ${newLogoUrl}`)
        } else {
          console.warn(`⚠ No rows updated for ${id}`)
        }
      } catch (error) {
        errors++
        console.error(`✗ Failed to update ${id}:`, error.message)
      }
    }

    console.log('\n=== Update Summary ===')
    console.log(`Total processed: ${successful.length}`)
    console.log(`Successfully updated: ${updated}`)
    console.log(`Errors: ${errors}`)
    console.log(`Failed uploads (not attempted): ${failed.length}`)

    if (failed.length > 0) {
      console.log('\nFailed uploads:')
      failed.forEach(f => {
        console.log(`  - ${f.id}: ${f.error}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()

