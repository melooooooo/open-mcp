import { createServerSupabaseClient } from "@/lib/supabase/server"
import { mapReferral } from "../_shared/mappers"
import { getCurrentUser, getPaging, ok } from "../_shared/response"
import { db } from "@repo/db"
import { userCollections } from "@repo/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { page, pageSize, from, to } = getPaging(request.nextUrl.searchParams, { page: 1, pageSize: 30 })
  const supabase = await createServerSupabaseClient()
  const { data, count, error } = await supabase
    .from("scraped_jobs")
    .select("id, title, link, publish_date, reply_count, source, company_name, job_type, location, salary", { count: "exact" })
    .order("publish_date", { ascending: false })
    .range(from, to)

  if (error) return ok({ items: [], total: 0, page, pageSize, error: error.message })

  const user = await getCurrentUser(request)
  const ids = (data || []).map((item) => item.id)
  const collected = new Set<string>()
  if (user?.id && ids.length > 0) {
    const rows = await db.query.userCollections.findMany({
      where: and(eq(userCollections.userId, user.id), inArray(userCollections.jobId, ids)),
      columns: { jobId: true },
    })
    rows.forEach((row) => collected.add(row.jobId))
  }

  return ok({
    items: (data || []).map((row) => ({ ...mapReferral(row), isCollected: collected.has(row.id) })),
    total: count || 0,
    page,
    pageSize,
  })
}
