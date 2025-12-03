import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') });

async function inspectReferrals() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();

    // Get column names and types
    console.log('Referrals table structure:');
    const colRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'career_platform' AND table_name = 'referrals'
      ORDER BY ordinal_position;
    `);

    console.log('\nColumns:');
    colRes.rows.forEach(row =>
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`)
    );

    // Get sample data
    console.log('\nSample data (first 3 rows):');
    const dataRes = await client.query(`
      SELECT * FROM career_platform.referrals LIMIT 3;
    `);

    if (dataRes.rows.length > 0) {
      console.log(JSON.stringify(dataRes.rows, null, 2));
    } else {
      console.log('No data in referrals table.');
    }

    // Count total rows
    const countRes = await client.query(`SELECT COUNT(*) as count FROM career_platform.referrals;`);
    console.log(`\nTotal rows: ${countRes.rows[0].count}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

inspectReferrals();
