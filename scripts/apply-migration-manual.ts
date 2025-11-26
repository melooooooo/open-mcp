import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();

  const migrationPath = path.resolve(__dirname, '../packages/db/drizzle/0011_solid_nova.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Executing migration SQL...');
  try {
    // Split by statement-breakpoint to execute statements one by one
    const statements = sql.split('--> statement-breakpoint');

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await client.query(statement);
      }
    }
    console.log('✅ Migration applied successfully!');
  } catch (e) {
    console.error('❌ Migration failed:', e);
  } finally {
    await client.end();
  }
}

main();
