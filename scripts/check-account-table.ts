import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT to_regclass('public.account') as exists;
  `);

  console.log('Account table exists:', res.rows[0].exists !== null);
  await client.end();
}

main();
