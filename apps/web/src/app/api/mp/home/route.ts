import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ok } from "../_shared/response"
import { mapExperience, mapJobListing, mapJobSite, mapReferral, relativeTime } from "../_shared/mappers"

const preferredSites = ["BOSS直聘", "智联招聘", "拉勾招聘", "前程无忧", "猎聘", "牛客网招聘", "实习僧", "国聘网"]

function preferredIndex(title: string) {
  const index = preferredSites.findIndex((name) => title?.includes(name))
  return index === -1 ? Number.POSITIVE_INFINITY : index
}

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const [jobSitesResult, experiencesResult, jobListingsResult, referralsResult] = await Promise.all([
    supabase.from("cp_job_sites").select("*").order("created_at", { ascending: false }).limit(30),
    supabase
      .from("finance_experiences")
      .select("id, slug, title, author_name, organization_name, article_type, job_title, tags, view_count, like_count, is_pinned, is_hot, publish_time, cover_asset_path, summary, industry")
      .order("is_pinned", { ascending: false })
      .order("is_hot", { ascending: false })
      .order("publish_time", { ascending: false })
      .limit(5),
    supabase.from("job_listings").select("*").order("source_updated_at", { ascending: false }).limit(5),
    supabase
      .from("scraped_jobs")
      .select("id, title, link, publish_date, reply_count, source, company_name")
      .order("publish_date", { ascending: false })
      .limit(8),
  ])

  const jobSites = (jobSitesResult.data || [])
    .map(mapJobSite)
    .sort((a, b) => {
      const pa = preferredIndex(a.title)
      const pb = preferredIndex(b.title)
      if (pa !== pb) return pa - pb
      return (b.viewCount || 0) - (a.viewCount || 0)
    })
    .slice(0, 8)

  const latestJobs = (jobListingsResult.data || []).map((row) => ({
    ...mapJobListing(row),
    timeText: relativeTime(row.source_updated_at || row.created_at),
  }))

  return ok({
    hotSearches: ["工商银行", "建设银行", "管培生", "金融科技", "数据分析", "客户经理", "风控", "产品经理"],
    jobSites,
    experiences: (experiencesResult.data || []).map(mapExperience),
    latestJobs,
    referrals: (referralsResult.data || []).map(mapReferral),
    stats: {
      totalJobSites: jobSitesResult.data?.length || 0,
      totalExperiences: experiencesResult.data?.length || 0,
      totalJobListings: jobListingsResult.data?.length || 0,
    },
  })
}

