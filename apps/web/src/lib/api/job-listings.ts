import { createClient } from '@/lib/supabase/client'

export type JobListing = {
  id: string
  serial_number: string
  company_name: string
  company_type: string
  industry_category: string
  job_title: string
  work_location: string
  deadline: string
  session: string
  degree_requirement: string
  batch: string
  announcement_source: string
  application_method: string
  remark: string | null
  major_requirement: string | null
  has_written_test: string | null
  referral_code: string | null
  source_updated_at: string
  created_at: string
}

export type JobListingParams = {
  page?: number
  pageSize?: number
  query?: string
  location?: string
  industry?: string
  session?: string
}

export async function getJobListings(params: JobListingParams) {
  const supabase = createClient()
  const { page = 1, pageSize = 20, query, location, industry, session } = params

  let dbQuery = supabase
    .from('job_listings')
    .select('*', { count: 'exact' })

  // Search (Job Title or Company Name)
  if (query) {
    dbQuery = dbQuery.or(`job_title.ilike.%${query}%,company_name.ilike.%${query}%`)
  }

  // Filters
  if (location) {
    dbQuery = dbQuery.ilike('work_location', `%${location}%`)
  }

  if (industry) {
    dbQuery = dbQuery.eq('industry_category', industry)
  }

  if (session) {
    dbQuery = dbQuery.eq('session', session)
  }

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await dbQuery
    .order('source_updated_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching job listings:', error)
    return { data: [], count: 0, error }
  }

  return { data: data as JobListing[], count: count || 0, error: null }
}

// Get unique values for filters
export async function getFilterOptions() {
  const supabase = createClient()

  // Note: This might be slow if table is huge, but fine for <10k rows
  // Ideally we should have separate tables or materialized views for these
  const { data: industries } = await supabase.rpc('get_unique_industries')
  const { data: sessions } = await supabase.rpc('get_unique_sessions')

  return {
    industries: (industries as string[]) || [],
    sessions: (sessions as string[]) || []
  }
}
