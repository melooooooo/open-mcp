import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Try loading env from multiple locations to be safe
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyRecentUpload() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('DATABASE_URL or POSTGRES_URL is missing in environment variables.');
    // Check if we can construct it from SUPABASE credentials if available (less reliable for direct PG connection usually, but worth a shot or just error out)
    console.log('Available Env Vars:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL')));
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();

    console.log('Connected to database. Checking for recently added jobs in `scraped_jobs`...\n');

    // Query for the 10 most recently created records
    // Assuming there is a created_at timestamp column which is standard. 
    // If not, we might sort by publish_date, but created_at is better for verification of "just uploaded".
    // Let's first check if created_at exists.

    const checkCol = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='scraped_jobs' AND column_name='created_at';
    `);

    let orderBy = 'publish_date';
    if (checkCol.rows.length > 0) {
      orderBy = 'created_at';
      console.log('Sorting by `created_at` (newest first).');
    } else {
      console.log('`created_at` column not found. Sorting by `publish_date` (newest first).');
    }

    const res = await client.query(`
      SELECT id, title, source, job_type, publish_date, ${checkCol.rows.length > 0 ? 'created_at' : ''}
      FROM scraped_jobs
      WHERE source = 'byr_bbs'
      ORDER BY ${orderBy} DESC
      LIMIT 10;
    `);

    console.log(`\nFound ${res.rows.length} recent records:`);
    res.rows.forEach((row, index) => {
      console.log(`\n[${index + 1}] ID: ${row.id}`);
      console.log(`    Title: ${row.title}`);
      console.log(`    Type: ${row.job_type}`);
      console.log(`    Date: ${row.publish_date}`);
      if (row.created_at) console.log(`    Created: ${row.created_at}`);
    });

    const totalCount = await client.query(`SELECT COUNT(*) as count FROM scraped_jobs WHERE source = 'byr_bbs'`);
    console.log(`\nTotal BYR BBS jobs in database: ${totalCount.rows[0].count}`);

  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyRecentUpload();
