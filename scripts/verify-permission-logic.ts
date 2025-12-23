
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Logic replicated from packages/trpc/routers/web/experiences.ts
function canEditExperience(
  userId: string,
  userRole: string | null | undefined,
  experience: { author_user_id: string | null }
): boolean {
  // 管理员可以编辑所有内容
  if (userRole === "admin") {
    return true;
  }
  // 作者可以编辑自己的内容
  if (experience.author_user_id && experience.author_user_id === userId) {
    return true;
  }
  return false;
}

async function main() {
  const title = '网联清算待遇大曝光_';
  console.log(`Testing permission logic for article: ${title}`);

  const { data: experience, error } = await supabase
    .from('finance_experiences')
    .select('id, title, author_user_id')
    .eq('title', title)
    .single();

  if (error || !experience) {
    console.error('Failed to fetch experience:', error);
    return;
  }

  const randomUserId = 'user-123';
  const authorUserId = experience.author_user_id;

  console.log(`Article Author ID: ${authorUserId}`);

  // Test 1: Random User (should fail)
  const canRandomEdit = canEditExperience(randomUserId, 'user', experience);
  console.log(`Test 1: Random User (${randomUserId}) can edit? ${canRandomEdit} (Expected: false)`);

  // Test 2: Admin User (should pass)
  const canAdminEdit = canEditExperience(randomUserId, 'admin', experience);
  console.log(`Test 2: Admin User (${randomUserId}) can edit? ${canAdminEdit} (Expected: true)`);

  // Test 3: The Author (if exists) (should pass)
  if (authorUserId) {
    const canAuthorEdit = canEditExperience(authorUserId, 'user', experience);
    console.log(`Test 3: Author (${authorUserId}) can edit? ${canAuthorEdit} (Expected: true)`);
  } else {
    console.log(`Test 3: No author set, skip author test.`);
  }

  // Test 4: Random User mimicking author (should fail if author is null)
  if (!authorUserId) {
    const canEditNull = canEditExperience(randomUserId, 'user', experience);
    console.log(`Test 4: Random User vs Null Author can edit? ${canEditNull} (Expected: false)`);
  }

}

main().catch(console.error);
