
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const envPath = path.resolve(process.cwd(), 'apps/web/.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function main() {
  console.log("Inspecting '北京银行待遇大曝光'...");

  const { data: article } = await supabase
    .from('finance_experiences')
    .select('id, title, markdown_content, content_html, metadata')
    .ilike('title', '%北京银行待遇大曝光%')
    .single();

  if (!article) {
    console.log("Article not found.");
    return;
  }

  console.log(`\n=== Article: ${article.title} (ID: ${article.id}) ===`);
  const md = article.markdown_content;
  const html = article.content_html || "";
  const metadata = article.metadata as any;
  const metaMd = metadata?.markdown_source?.content;

  console.log(`Markdown Length: ${md ? md.length : 'NULL'}`);
  console.log(`HTML Length: ${html.length}`);
  console.log(`Metadata Markdown Length: ${metaMd ? metaMd.length : 'NULL/Undefined'}`);

  if (metaMd) {
    const keywords = ["职场江湖指北", "-END-", "往期推荐"];
    keywords.forEach(kw => {
      const idx = metaMd.indexOf(kw);
      if (idx !== -1) {
        console.log(`[Metadata MD] Found keyword "${kw}" at index ${idx}`);
        console.log(`Context:\n${metaMd.slice(Math.max(0, idx - 50), idx + 100)}\n`);
      } else {
        console.log(`[Metadata MD] Keyword "${kw}" NOT found.`);
      }
    });
  }

  console.log("--------------------------------------------------\n");
}

main()
