import https from 'https'
import http from 'http'
import path from 'path'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: path.resolve('.env.local') })

const { Client } = pg

// 测试 URL 是否可访问
const testUrl = (url) => new Promise((resolve) => {
  const client = url.startsWith('https') ? https : http
  const timeout = 5000
  
  const req = client.get(url, { timeout }, (res) => {
    resolve({
      url,
      status: res.statusCode,
      ok: res.statusCode >= 200 && res.statusCode < 400
    })
  })
  
  req.on('error', (err) => {
    resolve({
      url,
      status: 0,
      ok: false,
      error: err.message
    })
  })
  
  req.on('timeout', () => {
    req.destroy()
    resolve({
      url,
      status: 0,
      ok: false,
      error: 'Timeout'
    })
  })
})

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Connected to database\n')

    // 查询所有职位站点
    const result = await client.query(`
      SELECT id, title, company_logo 
      FROM career_platform.job_sites 
      ORDER BY title
    `)

    console.log(`Testing ${result.rows.length} logo URLs...\n`)

    const tests = []
    for (const row of result.rows) {
      if (row.company_logo) {
        tests.push(
          testUrl(row.company_logo).then(result => ({
            ...result,
            title: row.title,
            id: row.id
          }))
        )
      }
    }

    const results = await Promise.all(tests)

    // 分类结果
    const r2Logos = results.filter(r => r.url.includes('store.yinhangbang.com'))
    const externalLogos = results.filter(r => !r.url.includes('store.yinhangbang.com'))
    
    const r2Success = r2Logos.filter(r => r.ok)
    const r2Failed = r2Logos.filter(r => !r.ok)
    
    const externalSuccess = externalLogos.filter(r => r.ok)
    const externalFailed = externalLogos.filter(r => !r.ok)

    // 显示结果
    console.log('=== R2 Hosted Logos ===')
    console.log(`Total: ${r2Logos.length}`)
    console.log(`✓ Accessible: ${r2Success.length}`)
    console.log(`✗ Failed: ${r2Failed.length}\n`)

    if (r2Failed.length > 0) {
      console.log('Failed R2 URLs:')
      r2Failed.forEach(r => {
        console.log(`  ✗ ${r.title}`)
        console.log(`    ${r.url}`)
        console.log(`    Error: ${r.error || `HTTP ${r.status}`}\n`)
      })
    }

    console.log('=== External Logos ===')
    console.log(`Total: ${externalLogos.length}`)
    console.log(`✓ Accessible: ${externalSuccess.length}`)
    console.log(`✗ Failed: ${externalFailed.length}\n`)

    if (externalFailed.length > 0) {
      console.log('Failed External URLs:')
      externalFailed.forEach(r => {
        console.log(`  ✗ ${r.title}`)
        console.log(`    ${r.url}`)
        console.log(`    Error: ${r.error || `HTTP ${r.status}`}\n`)
      })
    }

    // 总结
    console.log('=== Summary ===')
    console.log(`Total logos tested: ${results.length}`)
    console.log(`✓ All accessible: ${r2Success.length + externalSuccess.length}`)
    console.log(`✗ Failed: ${r2Failed.length + externalFailed.length}`)
    
    const successRate = ((r2Success.length + externalSuccess.length) / results.length * 100).toFixed(1)
    console.log(`Success rate: ${successRate}%`)

    // R2 迁移统计
    const r2Rate = (r2Logos.length / results.length * 100).toFixed(1)
    console.log(`\nR2 migration rate: ${r2Rate}%`)
    console.log(`R2 success rate: ${(r2Success.length / r2Logos.length * 100).toFixed(1)}%`)

    // 退出码
    if (r2Failed.length > 0) {
      console.log('\n⚠️  Some R2 logos are not accessible!')
      process.exit(1)
    } else {
      console.log('\n✅ All R2 logos are accessible!')
      process.exit(0)
    }

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()

