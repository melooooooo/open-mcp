
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
// Note: We need the URL and Anon Key. I'll try to read them from process.env or use placeholders if I can find them in the codebase.
// Actually, let's try to import the existing client creation logic if possible, but that might be hard with tsx due to alias paths.
// Let's just try to use the direct supabase-js client if we can find the credentials.
// Or better, let's try to use the existing `getExperienceBySlug` if we can resolve the aliases.

// Since resolving aliases with `tsx` can be tricky without proper setup, I will try to read the .env.local file first to get credentials.
// Then I will use supabase-js directly.

import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const envPath = path.resolve(process.cwd(), 'apps/web/.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  // Search for articles with broader keywords
  const { data: articles, error } = await supabase
    .from('finance_experiences')
    .select('id, title, markdown_content')
    .ilike('markdown_content', '%-END-%')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log("No articles found with keyword '-END-'.");
    return;
  }

  console.log(`Found ${articles.length} articles with '-END-'. Inspecting context...\n`);

  articles.forEach((article, index) => {
    const content = article.markdown_content || "";
    const indexEnd = content.indexOf("-END-");

    // Show 100 chars before and 200 chars after
    const start = Math.max(0, indexEnd - 100);
    const end = Math.min(content.length, indexEnd + 200);
    const context = content.slice(start, end);

    console.log(`--- Article ${index + 1}: ${article.title} (ID: ${article.id}) ---`);
    console.log(`Context:\n${context}\n`);
    console.log("--------------------------------------------------\n");
  });
}

main()

