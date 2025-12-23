
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. URL:', supabaseUrl ? 'Found' : 'Missing', 'Key:', supabaseKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Regex to match the footer pattern
// Matches lines at the end of the string that look like WeChat links
// e.g. https://mp.weixin.qq.com/s?__biz=...
// Also matches optional "阅读原文" (Read Original) or "来源" (Source) prefix
const FOOTER_REGEX = /(?:(?:阅读原文|来源|原文(?:链接)?)(?:[:：]\s*)?)?https?:\/\/(?:mp\.weixin\.qq\.com|in\.qq\.com)\/s\?__biz=[a-zA-Z0-9+/=]+(?:&[a-zA-Z0-9_=-]+)*#wechat_redirect\)?\s*$/i;

// Broader regex for just the link if the usage above is too strict
// This one finds the link at the end of the content, optionally surrounded by whitespace/newlines
const FOOTER_LINK_REGEX = /https?:\/\/(?:mp\.weixin\.qq\.com|in\.qq\.com)\/s\?__biz=[^\s#]+#wechat_redirect\)?\s*$/i;


async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isExecute = args.includes('--execute');

  if (!isDryRun && !isExecute) {
    console.log('Usage: npx tsx scripts/clean-experience-footers.ts [--dry-run | --execute]');
    process.exit(0);
  }

  console.log(`Starting cleanup in ${isDryRun ? 'DRY-RUN' : 'EXECUTION'} mode...`);

  // Fetch all articles
  // We need to fetch in chunks if there are too many, but for ~1000s it might be okay.
  // Let's use a cursor or just fetch all for simplicity if count is low (< 10000).
  // Assuming reasonable size for now.
  const { data: articles, error } = await supabase
    .from('finance_experiences')
    .select('id, title, markdown_content');

  if (error) {
    console.error('Error fetching articles:', error);
    process.exit(1);
  }

  console.log(`Total articles found: ${articles.length}`);

  let matchCount = 0;
  let updateCount = 0;

  for (const article of articles) {
    const content = article.markdown_content || '';

    // Check for match
    // we use a regex that matches the *end* of the string
    const match = content.match(FOOTER_LINK_REGEX);

    if (match) {
      matchCount++;
      const matchedText = match[0];
      const newContent = content.replace(FOOTER_LINK_REGEX, '').trim(); // Remove and trim trailing space

      if (isDryRun) {
        console.log(`\n[MATCH] Article ID: ${article.id}`);
        console.log(`Title: ${article.title}`);
        console.log(`--- Detected Footer (${matchedText.length} chars) ---`);
        console.log(matchedText);
        console.log(`--- End Detected Footer ---`);
      } else {
        // Update the article
        const { error: updateError } = await supabase
          .from('finance_experiences')
          .update({ markdown_content: newContent })
          .eq('id', article.id);

        if (updateError) {
          console.error(`Failed to update article ${article.id}:`, updateError);
        } else {
          updateCount++;
          if (updateCount % 10 === 0) process.stdout.write('.');
        }
      }
    }
  }

  console.log('\n--------------------------------------------------');
  console.log(`Summary:`);
  console.log(`Total Scanned: ${articles.length}`);
  console.log(`Matches Found: ${matchCount}`);
  if (!isDryRun) {
    console.log(`Updated: ${updateCount}`);
  } else {
    console.log(`To be Updated: ${matchCount}`);
    console.log(`Run with --execute to apply changes.`);
  }
}

main();
