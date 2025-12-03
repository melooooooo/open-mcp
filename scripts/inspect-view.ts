import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') });

async function inspectView() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT definition 
      FROM pg_views 
      WHERE viewname = 'cp_job_sites';
    `);

    if (res.rows.length > 0) {
      console.log('View definition:', res.rows[0].definition);
    } else {
      console.log('View not found in pg_views. Checking materialized views...');
      const matRes = await client.query(`
        SELECT definition 
        FROM pg_matviews 
        WHERE matviewname = 'cp_job_sites';
      `);
      if (matRes.rows.length > 0) {
        console.log('Materialized view definition:', matRes.rows[0].definition);
      } else {
        console.log('Not found as a view or materialized view.');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

inspectView();
