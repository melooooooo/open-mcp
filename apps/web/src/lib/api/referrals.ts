import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface ReferralJob {
  id: string
  title: string
  link: string | null
  publish_date: string | null
  reply_count: number | null
  source: string | null
  company_name: string | null
}

export async function getReferrals(limit = 8) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('scraped_jobs')
    .select('id, title, link, publish_date, reply_count, source, company_name')
    .order('publish_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching referrals:', error)
    return []
  }

  return data as ReferralJob[]
}
