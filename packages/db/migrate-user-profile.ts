import * as dotenv from "dotenv"
import * as path from "path"
import { Pool } from "pg"

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") })
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

async function addUserProfileFields() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log("开始添加用户资料字段...")

    // 添加 gender 字段
    await pool.query(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS gender text;
    `)
    console.log("✅ gender 字段已添加")

    // 添加 address 字段
    await pool.query(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS address text;
    `)
    console.log("✅ address 字段已添加")

    // 添加 contact_phone 字段
    await pool.query(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS contact_phone text;
    `)
    console.log("✅ contact_phone 字段已添加")

    // 验证字段是否添加成功
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      AND column_name IN ('gender', 'address', 'contact_phone')
      ORDER BY column_name;
    `)

    console.log("\n验证结果:")
    console.table(result.rows)

    console.log("\n✅ 数据库迁移完成!")

  } catch (error) {
    console.error("❌ 迁移失败:", error)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

addUserProfileFields()
