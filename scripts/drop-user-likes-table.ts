import dotenv from "dotenv";
import { resolve } from "path";
import { Client } from "pg";

// Load environment variables
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");
dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables");
  process.exit(1);
}

async function dropUserLikesTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Drop the user_likes table
    await client.query(`
      DROP TABLE IF EXISTS user_likes CASCADE;
    `);
    console.log("✅ Dropped user_likes table");

    console.log("\n🎉 Database cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during database cleanup:", error);
    throw error;
  } finally {
    await client.end();
  }
}

dropUserLikesTable()
  .then(() => {
    console.log("\n✅ Script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
