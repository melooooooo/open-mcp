import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type Referral = Database['public']['Tables']['referrals']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Job = Database['public']['Tables']['jobs']['Row']
type Company = Database['public']['Tables']['companies']['Row']

type ReferralWithRelations = Referral & {
  referrer: Profile | null
  jobs: (Job & {
    companies: Company | null
  }) | null
}

// 服务端函数 - 获取所有内推机会
export async function getReferrals() {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('referrals')
    .select(`
      *,
      referrer:profiles!referrals_referrer_id_fkey (
        id,
        username,
        full_name,
        avatar_url,
        bio,
        is_verified,
        is_referrer
      ),
      jobs (
        *,
        companies (*)
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching referrals:', error)
    return []
  }

  return data as ReferralWithRelations[]
}

// 服务端函数 - 获取单个内推详情
export async function getReferralById(id: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('referrals')
    .select(`
      *,
      referrer:profiles!referrals_referrer_id_fkey (
        id,
        username,
        full_name,
        avatar_url,
        bio,
        is_verified,
        is_referrer
      ),
      jobs (
        *,
        companies (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching referral:', error)
    return null
  }

  return data as ReferralWithRelations
}

// 客户端函数 - 搜索内推机会
export async function searchReferrals(params: {
  query?: string
  company?: string
  location?: string
  minSuccessRate?: number
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('referrals')
    .select(`
      *,
      referrer:profiles!referrals_referrer_id_fkey (
        id,
        username,
        full_name,
        avatar_url,
        bio,
        is_verified,
        is_referrer
      ),
      jobs!inner (
        *,
        companies (*)
      )
    `)
    .eq('status', 'active')

  // 添加搜索条件
  if (params.query) {
    query = query.or(`description.ilike.%${params.query}%`)
  }

  if (params.company) {
    query = query.eq('referrer.company', params.company)
  }

  if (params.location) {
    query = query.contains('jobs.location', [params.location])
  }

  if (params.minSuccessRate) {
    query = query.gte('referrer.success_rate', params.minSuccessRate)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching referrals:', error)
    return []
  }

  return data as ReferralWithRelations[]
}

// 客户端函数 - 获取热门内推官
export async function getTopReferrers(limit = 5) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'referrer')
    .order('success_rate', { ascending: false })
    .order('total_referred', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching top referrers:', error)
    return []
  }

  return data
}

// 客户端函数 - 申请内推
export async function applyForReferral(referralId: string, message?: string) {
  const supabase = createClient()
  
  // 获取当前用户
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('请先登录')
  }

  // 创建申请记录
  const { data, error } = await supabase
    .from('referral_applications')
    .insert({
      referral_id: referralId,
      applicant_id: user.id,
      message,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Error applying for referral:', error)
    throw error
  }

  // 更新内推的已使用名额
  await supabase.rpc('increment_referral_used', {
    referral_id: referralId
  })

  return data
}

// 客户端函数 - 获取内推统计数据
export async function getReferralStats() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('referrals')
    .select('quota_total, quota_used, referrer:users!referrals_referrer_id_fkey(success_rate)')
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching referral stats:', error)
    return {
      totalReferrals: 0,
      activeReferrers: 0,
      avgSuccessRate: 0,
      totalQuota: 0
    }
  }

  const stats = {
    totalReferrals: data.length,
    activeReferrers: new Set(data.map(r => r.referrer)).size,
    avgSuccessRate: Math.round(
      data.reduce((acc, r) => acc + (r.referrer?.success_rate || 0), 0) / 
      data.filter(r => r.referrer?.success_rate).length
    ),
    totalQuota: data.reduce((acc, r) => acc + (r.quota_total - r.quota_used), 0)
  }

  return stats
}