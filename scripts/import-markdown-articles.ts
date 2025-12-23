
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import matter from 'gray-matter';

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

const IMPORTS_DIR = path.resolve(__dirname, '../imports');

async function main() {
  if (!fs.existsSync(IMPORTS_DIR)) {
    console.error(`Imports directory not found: ${IMPORTS_DIR}`);
    return;
  }

  const files = fs.readdirSync(IMPORTS_DIR).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('No markdown files found in imports directory.');
    return;
  }

  console.log(`Found ${files.length} markdown files to import...`);

  for (const file of files) {
    const filePath = path.join(IMPORTS_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);

    // Infer title if not provided
    let title = frontmatter.title;
    if (!title) {
      // Try to find first h1
      const h1Match = content.match(/^#\s+(.+)$/m);
      if (h1Match) {
        title = h1Match[1].trim();
      } else {
        title = path.basename(file, '.md');
      }
    }

    // Infer slug
    const slug = frontmatter.slug || path.basename(file, '.md').toLowerCase().replace(/\s+/g, '-');

    // Guess organization from title or use a default
    let organization_name = '职场江湖指北'; // Default author/org
    if (title.includes('中信建投')) organization_name = '中信建投';
    else if (title.includes('网联清算')) organization_name = '网联清算';
    else if (title.includes('工商银行')) organization_name = '工商银行';
    else if (title.includes('大唐电信')) organization_name = '大唐电信';
    else if (title.includes('年终奖')) organization_name = '金融行业'; // Generic for summary articles

    // Default metadata
    const jobData = {
      title,
      slug,
      organization_name,
      content_text: content, // Storing raw markdown in content_text or content_html? 
      // The existing schema seems to use content_html and content_text. 
      // If I only have markdown, I might need to convert to HTML or store in markdown_content (if added by migration).
      // Based on ingest script, it puts text in content_text and html in content_html
      content_html: '', // Placeholder, ideally convert MD to HTML if needed
      markdown_content: content,
      publish_time: frontmatter.date || new Date().toISOString(),
      industry: frontmatter.industry || 'other',
      tags: frontmatter.tags || [],
      summary: frontmatter.summary || content.substring(0, 200),
      // Basic defaults
      view_count: 0,
      like_count: 0,
      difficulty: 3,
      status: 'published'
    };

    console.log(`Importing: ${title} (${slug})`);

    // Upsert
    const { error } = await supabase
      .from('finance_experiences')
      .upsert(jobData, { onConflict: 'slug' });

    if (error) {
      console.error(`Failed to import ${file}:`, error);
    } else {
      console.log(`Successfully imported ${file}`);
    }
  }
}

main().catch(console.error);
