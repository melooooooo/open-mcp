#!/usr/bin/env node
/**
 * Test database connection to Supabase
 */

import dotenv from "dotenv"
import { Client } from "pg"
import path from "node:path"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in .env.local")
  process.exit(1)
}

console.log("🔍 Testing database connection...")
console.log("📍 Database URL:", DATABASE_URL.replace(/:[^:@]+@/, ':****@'))

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

try {
  console.log("\n⏳ Connecting to database...")
  await client.connect()
  console.log("✅ Successfully connected to database!")
  
  console.log("\n⏳ Running test query...")
  const result = await client.query("SELECT NOW() as current_time, version() as pg_version")
  console.log("✅ Query successful!")
  console.log("📊 Current time:", result.rows[0].current_time)
  console.log("📊 PostgreSQL version:", result.rows[0].pg_version.split(' ')[0])
  
  console.log("\n⏳ Checking finance_experiences table...")
  const tableCheck = await client.query(`
    SELECT COUNT(*) as count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'finance_experiences'
  `)
  
  if (tableCheck.rows[0].count === '1') {
    console.log("✅ finance_experiences table exists")
    
    const rowCount = await client.query("SELECT COUNT(*) as count FROM finance_experiences")
    console.log("📊 Current row count:", rowCount.rows[0].count)
  } else {
    console.log("⚠️  finance_experiences table does not exist yet")
  }
  
  console.log("\n✅ All connection tests passed!")
  
} catch (error) {
  console.error("\n❌ Connection test failed!")
  console.error("Error:", error.message)
  console.error("\nFull error:", error)
  process.exit(1)
} finally {
  await client.end()
  console.log("\n🔌 Connection closed")
}

