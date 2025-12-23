
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isExecute = args.includes('--execute');

  if (!isDryRun && !isExecute) {
    console.log('Usage: npx tsx scripts/truncate-experience-end.ts [--dry-run | --execute]');
    process.exit(0);
  }

  console.log(`Starting truncation in ${isDryRun ? 'DRY-RUN' : 'EXECUTION'} mode...`);

  const { data: articles, error } = await supabase
    .from('finance_experiences')
    .select('id, title, markdown_content')
    .ilike('markdown_content', '%-END-%');

  if (error) {
    console.error('Error fetching articles:', error);
    process.exit(1);
  }

  console.log(`Found ${articles.length} articles containing '-END-'.`);

  let updateCount = 0;

  for (const article of articles) {
    const content = article.markdown_content || '';
    // Find the last occurrence, or just strict occurrence. 
    // The user image shows it at the end.
    // We should be careful not to delete matching text in the middle of a sentence if it exists (unlikely for -END-).
    // Let's use lastIndexOf to be safe if it appears multiple times, we likely want the last one which starts the footer.
    const index = content.lastIndexOf('-END-');

    if (index !== -1) {
      // Look back a few characters to see if there are formatting chars like _ or \ or spaces
      // In the log we saw "_\-END-_". 
      // We want to remove the formatting around it too.
      // Strategy: Find "-END-" and then look at the line it belongs to.
      // If the line is just "-END-" or "_-END-_" etc, remove that line and everything after.

      // Simple regex approach: Match line containing -END- and everything following.
      // Regex: /(_|\\|-)*END(_|\\|-)*[\s\S]*$/

      const match = content.match(/([_\-\\]*END[_\-\\]*)[\s\S]*$/);

      if (match) {
        const matchedFull = match[0];
        // The match index in the regex result is relative to the start of string if using normal match, 
        // but here we want to modify the content.

        // We can just use replace with the regex to an empty string, effectively truncating.
        // We should also trim the end of the remaining content.

        const newContent = content.substring(0, match.index).trim();

        if (isDryRun) {
          console.log(`\n[MATCH] Article ID: ${article.id}`);
          console.log(`Title: ${article.title}`);
          console.log(`--- Content to be Removed (${matchedFull.length} chars) ---`);
          console.log(matchedFull.slice(0, 200) + (matchedFull.length > 200 ? '...' : ''));
          console.log(`--- End Content ---`);
        } else {
          const { error: updateError } = await supabase
            .from('finance_experiences')
            .update({ markdown_content: newContent })
            .eq('id', article.id);

          if (updateError) {
            console.error(`Failed to update ${article.id}:`, updateError);
          } else {
            updateCount++;
          }
        }
      }
    }
  }

  console.log('\n--------------------------------------------------');
  console.log(`Summary:`);
  console.log(`Total Found: ${articles.length}`);
  if (!isDryRun) {
    console.log(`Updated: ${updateCount}`);
  } else {
    console.log(`To be Updated: ${articles.length}`);
    console.log(`Run with --execute to apply changes.`);
  }
}

main();
