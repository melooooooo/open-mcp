import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') });

async function listTables() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();

    // List all tables in career_platform schema
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'career_platform'
      ORDER BY table_name;
    `);

    console.log('Tables in career_platform schema:');
    res.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Check if there's a referrals table
    console.log('\nSearching for referral-related tables...');
    const refRes = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%referral%' OR table_name LIKE '%neitui%'
      ORDER BY table_schema, table_name;
    `);

    if (refRes.rows.length > 0) {
      console.log('Found referral tables:');
      refRes.rows.forEach(row => console.log(`  - ${row.table_schema}.${row.table_name}`));
    } else {
      console.log('No referral-related tables found.');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

listTables();
