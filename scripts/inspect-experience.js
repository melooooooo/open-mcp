
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

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
