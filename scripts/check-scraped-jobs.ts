import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') });

async function checkScrapedJobs() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();

    console.log('Checking scraped_jobs table...\n');

    // Count total rows
    const countRes = await client.query(`SELECT COUNT(*) as count FROM scraped_jobs;`);
    console.log(`Total rows in scraped_jobs: ${countRes.rows[0].count}`);

    // Search for "建设银行"
    const searchRes = await client.query(`
      SELECT id, title, link, publish_date, source
      FROM scraped_jobs
      WHERE title LIKE '%建设银行%'
      ORDER BY publish_date DESC
      LIMIT 5;
    `);

    console.log(`\nRows matching "建设银行": ${searchRes.rows.length}`);
    if (searchRes.rows.length > 0) {
      console.log('\nSample results:');
      searchRes.rows.forEach((row, i) => {
        console.log(`\n${i + 1}. ${row.title}`);
        console.log(`   Date: ${row.publish_date}`);
        console.log(`   Source: ${row.source}`);
      });
    }

    // Get column structure
    console.log('\n\nTable structure:');
    const colRes = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'scraped_jobs'
      ORDER BY ordinal_position;
    `);
    colRes.rows.forEach(row =>
      console.log(`  - ${row.column_name}: ${row.data_type}`)
    );

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkScrapedJobs();
