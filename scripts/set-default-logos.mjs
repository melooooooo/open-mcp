import path from 'path'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: path.resolve('.env.local') })

const { Client } = pg

// 仍然失败的站点，使用默认 logo
const failedSites = [
  {
    id: "8543509b-32e5-45a1-afa9-a93c41024c6b",
    title: "领英 (LinkedIn)",
    // 使用 LinkedIn 的官方 logo URL
    defaultLogo: "https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca"
  },
  {
    id: "1200790f-032e-4ecb-941b-cdaeb36166a2",
    title: "中国公共招聘网",
    // 使用一个通用的政府网站图标
    defaultLogo: "https://www.google.com/s2/favicons?domain=gov.cn&sz=128"
  },
  {
    id: "d0e2b961-0091-4601-aebb-d6e1a7795b0e",
    title: "海投网",
    // 使用一个通用的招聘网站图标
    defaultLogo: "https://www.google.com/s2/favicons?domain=haitou.cc&sz=128"
  },
  {
    id: "4b97aae1-dca2-4289-add6-f82c133bcb00",
    title: "兼职猫",
    // 使用一个通用的招聘图标
    defaultLogo: "https://www.google.com/s2/favicons?domain=jianzhimao.cn&sz=128"
  }
]

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Connected to database')

    for (const site of failedSites) {
      const { id, title, defaultLogo } = site

      try {
        const result = await client.query(
          `UPDATE career_platform.job_sites 
           SET company_logo = $1, updated_at = NOW()
           WHERE id = $2`,
          [defaultLogo, id]
        )

        if (result.rowCount > 0) {
          console.log(`✓ Updated ${title}: ${defaultLogo}`)
        } else {
          console.warn(`⚠ No rows updated for ${title}`)
        }
      } catch (error) {
        console.error(`✗ Failed to update ${title}:`, error.message)
      }
    }

    console.log('\n=== Summary ===')
    console.log(`Total sites updated with default logos: ${failedSites.length}`)

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()

