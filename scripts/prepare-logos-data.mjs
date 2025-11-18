import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: path.resolve('.env.local') })

const { Client } = pg

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Connected to database')

    // 查询所有 job_sites 数据
    const result = await client.query(`
      SELECT 
        id, 
        title, 
        company_logo as "currentLogo", 
        website_url as url
      FROM career_platform.job_sites
      ORDER BY created_at DESC
    `)

    console.log(`Found ${result.rows.length} job sites`)

    // 写入到 /tmp/all-logos.json
    const outputPath = '/tmp/all-logos.json'
    fs.writeFileSync(outputPath, JSON.stringify(result.rows, null, 2))
    console.log(`Data written to ${outputPath}`)

    // 显示前几条数据作为预览
    console.log('\nPreview (first 3 records):')
    console.log(JSON.stringify(result.rows.slice(0, 3), null, 2))

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()

