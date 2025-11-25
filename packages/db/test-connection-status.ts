import * as dotenv from "dotenv"
import * as path from "path"
import { Pool } from "pg"

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") })
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log("测试数据库连接...")
    console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 30) + "...")

    const result = await pool.query('SELECT NOW()')
    console.log("✅ 数据库连接成功!")
    console.log("当前时间:", result.rows[0].now)

    // 验证 user 表的新字段
    const schemaCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      AND column_name IN ('gender', 'address', 'contact_phone')
    `)

    console.log("\n新字段验证:")
    schemaCheck.rows.forEach(row => {
      console.log(`✅ ${row.column_name} 字段存在`)
    })

    if (schemaCheck.rows.length === 3) {
      console.log("\n✅ 所有新字段都已成功添加!")
    } else {
      console.log(`\n⚠️  只找到 ${schemaCheck.rows.length}/3 个字段`)
    }

  } catch (error: any) {
    console.error("❌ 数据库连接失败!")
    console.error("错误:", error.message)
    if (error.code === 'ENOTFOUND') {
      console.error("\n这是 DNS 解析错误,可能的原因:")
      console.error("1. 网络连接问题")
      console.error("2. Supabase 服务不可用")
      console.error("3. 需要检查 DATABASE_URL 配置")
    }
  } finally {
    await pool.end()
    process.exit(0)
  }
}

testConnection()
