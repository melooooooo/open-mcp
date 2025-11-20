
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
  const slug = decodeURIComponent('%E4%B8%AD%E5%9B%BD%E4%BA%BA%E4%BF%9D%E5%BE%85%E9%81%87%E5%A4%A7%E6%9B%9D%E5%85%89')
  console.log('Fetching experience for slug:', slug)

  const { data, error } = await supabase
    .from('finance_experiences')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Experience Data:', JSON.stringify(data, null, 2))
}

main()
