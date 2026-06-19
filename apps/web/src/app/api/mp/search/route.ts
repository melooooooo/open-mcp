import { createServerSupabaseClient } from "@/lib/supabase/server"
import { mapExperience, mapJobListing, mapJobSite } from "../_shared/mappers"
import { ok } from "../_shared/response"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim()
  if (!query) {
    return ok({ jobListings: [], experiences: [], jobSites: [] })
  }

  const supabase = await createServerSupabaseClient()
  const escaped = query.replace(/,/g, "\\,")
  const [jobsResult, experiencesResult, sitesResult] = await Promise.all([
    supabase
      .from("feishu_job_listings")
      .select("*")
      .or(`job_title.ilike.%${escaped}%,company_name.ilike.%${escaped}%`)
      .order("source_updated_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(10),
    supabase
      .from("finance_experiences")
      .select("id, slug, title, author_name, organization_name, article_type, job_title, tags, view_count, like_count, publish_time, summary, industry")
      .or(`tags.cs.{${escaped}},title.ilike.%${escaped}%,organization_name.ilike.%${escaped}%,job_title.ilike.%${escaped}%`)
      .order("publish_time", { ascending: false })
      .limit(10),
    supabase
      .from("cp_job_sites")
      .select("*")
      .or(`title.ilike.%${escaped}%,company_name.ilike.%${escaped}%`)
      .order("view_count", { ascending: false })
      .limit(10),
  ])

  return ok({
    jobListings: (jobsResult.data || []).map(mapJobListing),
    experiences: (experiencesResult.data || []).map(mapExperience),
    jobSites: (sitesResult.data || []).map(mapJobSite),
  })
}
