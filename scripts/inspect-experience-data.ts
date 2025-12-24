
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Explicitly resolve directly to the file to avoid relative path confusion
const envPath = path.resolve('/Users/jiang/develop/GitHub/open-mcp/apps/web/.env')
dotenv.config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in', envPath)
  console.log('URL:', supabaseUrl)
  console.log('KEY:', supabaseAnonKey ? 'Found' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
  const { data: experiences, error } = await supabase
    .from('finance_experiences')
    .select('title, slug, sections, markdown_content, content_html')
    .ilike('title', '%网联清算%')
    .limit(1)

  if (error) {
    console.error('Error fetching experience:', error)
    return
  }

  if (!experiences || experiences.length === 0) {
    console.log('No experience found')
    return
  }

  const exp = experiences[0]
  console.log('Title:', exp.title)
  console.log('Slug:', exp.slug)
  console.log('Markdown Length:', exp.markdown_content?.length)
  console.log('Sections Count (in DB):', Array.isArray(exp.sections) ? exp.sections.length : 'Not an array')
  if (Array.isArray(exp.sections)) {
    console.log('Sections details:', JSON.stringify(exp.sections.map(s => ({
      title: s.title,
      anchor: s.anchor,
      bodyHtmlLength: s.body_html?.length
    })), null, 2))
  }
}

main()
