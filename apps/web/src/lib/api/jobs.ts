import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/client'

// Using career_platform schema at runtime. Keep types broad to avoid mismatch with legacy public schema types.
type JobWithCompany = any

// 服务端函数 - 获取所有职位（视图优先，失败则回退到 schema 直查）
export async function getJobs() {
  const supabase = await createServerSupabaseClient()

  // 方案 A：public 视图
  let { data, error } = await supabase
    .from('cp_jobs')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching jobs via view:', JSON.stringify(error, null, 2))
    // 方案 B：直查 schema 表（避免视图权限/策略导致的问题）
    const fallback = await supabase
      .schema('career_platform')
      .from('jobs')
      .select(`
        *,
        companies (*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (fallback.error) {
      console.error('Error fetching jobs via schema:', JSON.stringify(fallback.error, null, 2))
      return []
    }

    data = fallback.data as any
  }

  return data as JobWithCompany[]
}

// 服务端函数 - 获取单个职位详情（视图优先，失败则回退）
export async function getJobById(id: string) {
  const supabase = await createServerSupabaseClient()

  let { data, error } = await supabase
    .from('cp_jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching job via view:', JSON.stringify(error, null, 2))

    const fallback = await supabase
      .schema('career_platform')
      .from('jobs')
      .select(`
        *,
        companies (*)
      `)
      .eq('id', id)
      .single()

    if (fallback.error) {
      console.error('Error fetching job via schema:', JSON.stringify(fallback.error, null, 2))
      return null
    }

    data = fallback.data as any
  }

  return data as JobWithCompany
}

// 客户端函数 - 搜索职位
export async function searchJobs(params: {
  query?: string
  location?: string
  jobType?: string
  salaryMin?: number
  salaryMax?: number
}) {
  const supabase = createClient()

  let query = supabase
    .schema('career_platform')
    .from('jobs')
    .select(`
      *,
      companies (*)
    `)
    .eq('status', 'active')

  // 添加搜索条件
  if (params.query) {
    query = query.or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`)
  }

  if (params.location) {
    query = query.contains('location', [params.location])
  }

  if (params.jobType) {
    query = query.eq('job_type', params.jobType)
  }

  if (params.salaryMin) {
    query = query.gte('salary_min', params.salaryMin)
  }

  if (params.salaryMax) {
    query = query.lte('salary_max', params.salaryMax)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching jobs:', error)
    return []
  }

  return data as JobWithCompany[]
}

// 客户端函数 - 获取热门职位
export async function getHotJobs(limit = 6) {
  const supabase = createClient()

  const { data, error } = await supabase
    .schema('career_platform')
    .from('jobs')
    .select(`
      *,
      companies (*)
    `)
    .eq('status', 'active')
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching hot jobs:', error)
    return []
  }

  return data as JobWithCompany[]
}

// 客户端函数 - 获取最新职位
export async function getNewJobs(limit = 6) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cp_jobs')
    .select(`*`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching new jobs:', error)
    return []
  }

  return data as JobWithCompany[]
}

// 客户端函数 - 增加浏览量
export async function incrementJobView(jobId: string) {
  const supabase = createClient()

  const { error } = await supabase.rpc('increment_job_view', {
    job_id: jobId
  })

  if (error) {
    console.error('Error incrementing view count:', error)
  }
}