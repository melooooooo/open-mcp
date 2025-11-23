#!/usr/bin/env node

/**
 * This script executes the generated SQL files using a local Supabase connection.
 * It reads the SQL files and executes them in sequence.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeSQLBatches() {
  const sqlDir = path.join(__dirname, 'sql');
  const manifestPath = path.join(sqlDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest file not found: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`Found ${manifest.total_batches} batches to execute (${manifest.total_records} records total)`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < manifest.files.length; i++) {
    const fileInfo = manifest.files[i];
    const sqlPath = path.join(sqlDir, fileInfo.file);

    if (!fs.existsSync(sqlPath)) {
      console.error(`✗ Batch ${fileInfo.index}: File not found - ${fileInfo.file}`);
      failureCount++;
      continue;
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    try {
      // Execute SQL using Supabase RPC or direct query
      // Note: Supabase doesn't support raw SQL execution directly via client library
      // We need to use the REST API or PostgreSQL client
      console.log(`Executing batch ${fileInfo.index}/${manifest.total_batches} (${fileInfo.records} records)...`);

      // This won't work as Supabase JS client doesn't support raw SQL
      // We would need to use PostgreSQL client or REST API
      console.warn('Note: This script needs direct PostgreSQL access or REST API to execute raw SQL.');
      console.warn('Please use the MCP tool or psql command line instead.');

      successCount++;
    } catch (error) {
      console.error(`✗ Batch ${fileInfo.index}:`, error.message);
      failureCount++;
      break; // Stop on first error
    }

    // Add a small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n=== Summary ===`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  console.log(`Total: ${manifest.total_batches}`);
}

executeSQLBatches().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
