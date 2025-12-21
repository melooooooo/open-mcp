import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizeDate(dateStr: string | null): string | null {
  if (!dateStr) return null;

  // Clean whitespace
  let date = dateStr.trim();

  // Match YYYY/M/D or YYYY-M-D
  const match = date.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);

  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  return date; // Return original if not matching expected pattern
}

async function main() {
  console.log('Fetching job listings...');

  // Fetch all jobs in chunks
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  let updatedCount = 0;
  let processedCount = 0;

  while (hasMore) {
    const { data: jobs, error } = await supabase
      .from('job_listings')
      .select('id, source_updated_at')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching jobs:', error);
      break;
    }

    if (!jobs || jobs.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Processing batch ${page + 1}, found ${jobs.length} jobs...`);

    // Prepare updates
    const updates = [];

    for (const job of jobs) {
      processedCount++;
      const originalDate = job.source_updated_at;
      const normalizedDate = normalizeDate(originalDate);

      if (normalizedDate && normalizedDate !== originalDate) {
        updates.push({
          id: job.id,
          source_updated_at: normalizedDate
        });
      }
    }

    if (updates.length > 0) {
      console.log(`Found ${updates.length} dates to normalize in this batch.`);

      // Parallel updates with error handling
      const BATCH_SIZE = 20;
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batchUpdates = updates.slice(i, i + BATCH_SIZE);
        await Promise.all(batchUpdates.map(async (update) => {
          try {
            const { error } = await supabase
              .from('job_listings')
              .update({ source_updated_at: update.source_updated_at })
              .eq('id', update.id);
            if (error) console.error(`Failed to update ${update.id}:`, error.message);
          } catch (err) {
            console.error(`Exception updating ${update.id}:`, err);
          }
        }));
      }
      updatedCount += updates.length;
    }

    page++;

    // Safety break
    if (page > 100) break;
  }

  console.log(`Done! Processed ${processedCount} jobs. Updated ${updatedCount} dates.`);
}

main();
