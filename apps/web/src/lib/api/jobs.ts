import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type Job = Database['public']['Tables']['jobs']['Row']
type Company = Database['public']['Tables']['companies']['Row']
type JobWithCompany = Job & {
  companies: Company | null
}

// 服务端函数 - 获取所有职位
export async function getJobs() {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      companies (*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }

  return data as JobWithCompany[]
}

// 服务端函数 - 获取单个职位详情
export async function getJobById(id: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      companies (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching job:', error)
    return null
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
    .from('jobs')
    .select(`
      *,
      companies (*)
    `)
    .eq('status', 'active')
    .eq('is_hot', true)
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
    .from('jobs')
    .select(`
      *,
      companies (*)
    `)
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