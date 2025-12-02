import { getJobs } from "@/lib/api/jobs"
import { getLatestJobListings } from "@/lib/api/job-listings"
import { getExperiencesList } from "@/lib/api/experiences"
import { HomeClientNew } from "./home-client-new"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function HomeDataWrapperNew() {
  // 获取职位站点数据（求职导航）
  const jobSites = await getJobs()

  // 获取经验分享数据
  const { items: experiences } = await getExperiencesList({ limit: 5 })

  // 获取最新招聘信息
  const latestJobListings = await getLatestJobListings(5)

  // 获取统计数据
  const supabase = await createServerSupabaseClient()

  // 获取职位站点总数
  const { count: jobSitesCount } = await supabase
    .from('cp_job_sites')
    .select('*', { count: 'exact', head: true })

  // 获取经验分享总数
  const { count: experiencesCount } = await supabase
    .from('finance_experiences')
    .select('*', { count: 'exact', head: true })

  // 获取招聘信息总数（job_listings 表）
  const { count: jobListingsCount } = await supabase
    .from('job_listings')
    .select('*', { count: 'exact', head: true })

  const stats = {
    totalJobSites: jobSitesCount || 0,
    totalExperiences: experiencesCount || 0,
    totalJobListings: jobListingsCount || 0,
  }

  return (
    <HomeClientNew
      jobSites={jobSites}
      experiences={experiences}
      latestJobListings={latestJobListings}
      stats={stats}
    />
  )
}
