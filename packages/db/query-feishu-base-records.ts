import * as dotenv from "dotenv"
import * as path from "path"
import { Pool } from "pg"

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") })
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const TARGET_SCHEMA = "public"
const TARGET_TABLE = "feishu_base_records"

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    const exists = await pool.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = $1 AND table_name = $2
       ) AS table_exists`,
      [TARGET_SCHEMA, TARGET_TABLE]
    )

    const tableExists: boolean = exists.rows[0]?.table_exists === true

    if (!tableExists) {
      console.log(`❌ 表 ${TARGET_SCHEMA}.${TARGET_TABLE} 不存在`)
      return
    }

    console.log(`✅ 表 ${TARGET_SCHEMA}.${TARGET_TABLE} 存在`)

    const columns = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [TARGET_SCHEMA, TARGET_TABLE]
    )

    console.log(`\n字段列表 (${columns.rows.length}):`)
    columns.rows.forEach((row) => {
      console.log(
        `  - ${row.column_name} : ${row.data_type} (nullable: ${row.is_nullable})`
      )
    })

    const count = await pool.query(
      `SELECT COUNT(*)::int AS row_count FROM ${TARGET_SCHEMA}.${TARGET_TABLE}`
    )
    console.log(`\n行数: ${count.rows[0]?.row_count}`)
  } catch (error: any) {
    console.error("❌ 查询失败:", error.message)
  } finally {
    await pool.end()
  }
}

main()
