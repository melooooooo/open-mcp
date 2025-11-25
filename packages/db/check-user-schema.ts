import * as dotenv from "dotenv"
import * as path from "path"
import { Pool } from "pg"

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") })
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

async function checkUserSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      ORDER BY ordinal_position;
    `)

    console.log("User table schema:")
    console.table(result.rows)

    // 检查新字段
    const newFields = ['gender', 'address', 'contact_phone']
    const columns = result.rows.map((row: any) => row.column_name)

    console.log("\n检查新字段:")
    newFields.forEach(field => {
      const exists = columns.includes(field)
      console.log(`${field}: ${exists ? '✅ 已添加' : '❌ 未找到'}`)
    })

  } catch (error) {
    console.error("Error:", error)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

checkUserSchema()
