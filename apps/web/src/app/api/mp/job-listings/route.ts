import { createServerSupabaseClient } from "@/lib/supabase/server"
import { mapJobListing } from "../_shared/mappers"
import { getCurrentUser, getPaging, ok, splitParam } from "../_shared/response"
import { db } from "@repo/db"
import { userJobListingCollections } from "@repo/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const { page, pageSize, from, to } = getPaging(searchParams)
  const supabase = await createServerSupabaseClient()

  let query = supabase.from("feishu_job_listings").select("*", { count: "exact" })

  const keyword = searchParams.get("query")?.trim()
  const location = searchParams.get("location")?.trim()
  const companyTypes = splitParam(searchParams.get("companyType"))
  const session = searchParams.get("session")?.trim()
  const jobType = searchParams.get("jobType")?.trim()

  if (keyword) {
    const escaped = keyword.replace(/,/g, "\\,")
    query = query.or(`job_title.ilike.%${escaped}%,company_name.ilike.%${escaped}%`)
  }
  if (location) query = query.ilike("work_location", `%${location}%`)
  if (companyTypes.length > 0) query = query.in("company_type", companyTypes)
  if (session && session !== "all") query = query.ilike("session", `%${session}%`)
  if (jobType === "campus") query = query.or("batch.ilike.%春招%,batch.ilike.%秋招%")
  if (jobType === "intern") query = query.ilike("batch", "%实习%")

  const { data, count, error } = await query
    .order("source_updated_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to)
  if (error) {
    return ok({ items: [], total: 0, page, pageSize, error: error.message })
  }

  const user = await getCurrentUser(request)
  const ids = (data || []).map((item) => item.id)
  const collected = new Set<string>()
  if (user?.id && ids.length > 0) {
    const rows = await db.query.userJobListingCollections.findMany({
      where: and(eq(userJobListingCollections.userId, user.id), inArray(userJobListingCollections.jobListingId, ids)),
      columns: { jobListingId: true },
    })
    rows.forEach((row) => collected.add(row.jobListingId))
  }

  return ok({
    items: (data || []).map((row) => ({ ...mapJobListing(row), isCollected: collected.has(row.id) })),
    total: count || 0,
    page,
    pageSize,
  })
}
