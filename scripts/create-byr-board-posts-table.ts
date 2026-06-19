import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const SQL_FILE_PATH = path.resolve(__dirname, '../packages/db/sql/create_byr_board_posts.sql');

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL or POSTGRES_URL must be set.');
  process.exit(1);
}

async function main() {
  const sql = fs.readFileSync(SQL_FILE_PATH, 'utf-8');
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);
    console.log('Table byr_board_posts created/verified successfully.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Failed to create byr_board_posts table:', error);
  process.exit(1);
});
