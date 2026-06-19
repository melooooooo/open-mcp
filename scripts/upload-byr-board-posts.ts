import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const JSON_FILE_PATH = path.resolve(__dirname, '../byr_board_posts.json');
const TABLE_NAME = 'byr_board_posts';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and a Supabase key (SUPABASE_SERVICE_ROLE_KEY / SUPABASE_KEY) must be set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

interface ByrBoardPost {
  board: string;
  boardName: string;
  title: string;
  link: string;
  externalId: string;
  date: string;
  publishedAt?: string;
  author: string;
  replyCount: number;
  lastReplyDate: string;
  isTop: boolean;
  content?: string;
}

async function main() {
  if (!fs.existsSync(JSON_FILE_PATH)) {
    console.error(`Error: JSON file not found: ${JSON_FILE_PATH}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
  const posts: ByrBoardPost[] = JSON.parse(rawData);
  console.log(`Found ${posts.length} BYR board posts to process.`);

  let insertedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;

  for (const post of posts) {
    if (!post.board || !post.externalId) {
      failedCount++;
      console.error('Skip invalid post without board or externalId:', post.title);
      continue;
    }

    const payload = {
      board: post.board,
      board_name: post.boardName,
      title: post.title,
      link: post.link,
      content: post.content || null,
      author: post.author || null,
      reply_count: post.replyCount || 0,
      publish_date: post.date || null,
      published_at: post.publishedAt || null,
      last_reply_date: post.lastReplyDate || null,
      is_top: post.isTop,
      source: 'byr_bbs',
      external_id: post.externalId,
      raw: post,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: selectError } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('board', post.board)
      .eq('external_id', post.externalId)
      .maybeSingle();

    if (selectError) {
      console.error(`Failed to query ${post.board}/${post.externalId}:`, selectError);
      failedCount++;
      continue;
    }

    if (existing) {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update(payload)
        .eq('id', existing.id);

      if (error) {
        console.error(`Failed to update ${post.board}/${post.externalId}:`, error);
        failedCount++;
      } else {
        console.log(`Updated ${post.board}/${post.externalId}`);
        updatedCount++;
      }
    } else {
      const { error } = await supabase
        .from(TABLE_NAME)
        .insert(payload);

      if (error) {
        console.error(`Failed to insert ${post.board}/${post.externalId}:`, error);
        failedCount++;
      } else {
        console.log(`Inserted ${post.board}/${post.externalId}`);
        insertedCount++;
      }
    }
  }

  console.log('\n--- BYR board posts summary ---');
  console.log(`Total: ${posts.length}`);
  console.log(`Inserted: ${insertedCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Failed to upload BYR board posts:', error);
  process.exit(1);
});
