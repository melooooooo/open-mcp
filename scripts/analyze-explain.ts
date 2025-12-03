import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') });

async function analyzeAndExplain() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();

    console.log('Running ANALYZE...');
    await client.query('ANALYZE job_listings;');
    await client.query('ANALYZE finance_experiences;');
    await client.query('ANALYZE career_platform.job_sites;');
    console.log('ANALYZE complete.');

    console.log('Explaining query for job_listings...');
    const explainRes = await client.query(`
      EXPLAIN ANALYZE SELECT id, job_title, company_name 
      FROM job_listings 
      WHERE job_title LIKE '%建设银行%' OR company_name LIKE '%建设银行%'
      ORDER BY source_updated_at DESC 
      LIMIT 20;
    `);
    console.log('Query Plan (job_listings):');
    explainRes.rows.forEach(row => console.log(row['QUERY PLAN']));

    console.log('Explaining query for finance_experiences...');
    const explainExp = await client.query(`
      EXPLAIN ANALYZE SELECT id, title, organization_name 
      FROM finance_experiences 
      WHERE title LIKE '%建设银行%' OR organization_name LIKE '%建设银行%'
      ORDER BY publish_time DESC 
      LIMIT 20;
    `);
    console.log('Query Plan (finance_experiences):');
    explainExp.rows.forEach(row => console.log(row['QUERY PLAN']));

    console.log('Explaining query for career_platform.job_sites...');
    const explainSites = await client.query(`
      EXPLAIN ANALYZE SELECT id, title, company_name 
      FROM career_platform.job_sites 
      WHERE title LIKE '%建设银行%' OR company_name LIKE '%建设银行%'
      ORDER BY created_at DESC 
      LIMIT 20;
    `);
    console.log('Query Plan (career_platform.job_sites):');
    explainSites.rows.forEach(row => console.log(row['QUERY PLAN']));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

analyzeAndExplain();
