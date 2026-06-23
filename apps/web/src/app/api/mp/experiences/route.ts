import { createServerSupabaseClient } from "@/lib/supabase/server"
import { mapExperienceWithExcerpt } from "../_shared/mappers"
import { getCurrentUser, getPaging, ok } from "../_shared/response"
import { db } from "@repo/db"
import { userExperienceLikes } from "@repo/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const { page, pageSize, from, to } = getPaging(searchParams, { page: 1, pageSize: 12 })
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from("finance_experiences")
    .select(
      "id, slug, title, author_name, organization_name, article_type, job_title, tags, difficulty, read_time_minutes, view_count, like_count, comment_count, is_pinned, is_hot, publish_time, cover_asset_path, summary, industry, markdown_content, content_html, metadata",
      { count: "estimated" }
    )

  const keyword = searchParams.get("tag")?.trim() || searchParams.get("query")?.trim()
  const industry = searchParams.get("industry")?.trim()
  if (industry) query = query.eq("industry", industry)
  if (keyword) {
    const escaped = keyword.replace(/,/g, "\\,")
    query = query.or(
      [`tags.cs.{${escaped}}`, `title.ilike.%${escaped}%`, `organization_name.ilike.%${escaped}%`, `job_title.ilike.%${escaped}%`].join(",")
    )
  }

  const { data, count, error } = await query
    .order("is_pinned", { ascending: false })
    .order("is_hot", { ascending: false })
    .order("publish_time", { ascending: false })
    .range(from, to)

  if (error) return ok({ items: [], total: 0, page, pageSize, error: error.message })

  const user = await getCurrentUser(request)
  const ids = (data || []).map((item) => item.id)
  const liked = new Set<string>()
  if (user?.id && ids.length > 0) {
    const rows = await db.query.userExperienceLikes.findMany({
      where: and(eq(userExperienceLikes.userId, user.id), inArray(userExperienceLikes.experienceId, ids)),
      columns: { experienceId: true },
    })
    rows.forEach((row) => liked.add(row.experienceId))
  }

  return ok({
    items: await Promise.all(
      (data || []).map(async (row) => ({ ...(await mapExperienceWithExcerpt(row)), isLiked: liked.has(row.id) }))
    ),
    total: count || 0,
    page,
    pageSize,
  })
}
