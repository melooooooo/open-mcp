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
  companyType?: string
  session?: string
}

export const COMPANY_TYPES = [
  '央国企',
  '民企',
  '外企',
  '事业单位',
  '合资',
  '社会组织',
  '政府机关',
  '国企',
  '其他'
]

export const INDUSTRY_CATEGORIES = [
  'IT/互联网/游戏',
  '专利/商标/知识产权',
  '交通/物流/仓储',
  '人力资源服务',
  '农林牧渔',
  '医疗/医药/生物',
  '咨询',
  '商务服务业',
  '快速消费品',
  '房地产业/建筑业',
  '政府/机构/组织',
  '教育/培训/科研',
  '文化/传媒/广告/体育',
  '新能源',
  '智能硬件',
  '未明确',
  '机械/制造业',
  '检测/认证',
  '汽车制造/维修/零配件',
  '法律',
  '生活服务业',
  '耐用消费品',
  '能源/化工/环保',
  '财务/审计/税务',
  '贸易/批发/零售',
  '通信/电子/半导体',
  '金融业'
]

export const SESSION_OPTIONS = [
  '2024届',
  '2025届',
  '2026届',
  '2027届',
  '不限届'
]

export async function getJobListings(params: JobListingParams) {
  const supabase = createClient()
  const { page = 1, pageSize = 20, query, location, industry, companyType, session } = params

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

  if (companyType) {
    dbQuery = dbQuery.eq('company_type', companyType)
  }

  if (session) {
    // Use ilike for fuzzy matching (e.g. "2026届" matches "2025,2026届")
    dbQuery = dbQuery.ilike('session', `%${session}%`)
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
  // Return static constants for all filters to ensure consistency and performance
  return {
    industries: INDUSTRY_CATEGORIES,
    companyTypes: COMPANY_TYPES,
    sessions: SESSION_OPTIONS
  }
}
