import { createServerSupabaseClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@repo/db"
import { userExperienceLikes } from "@repo/db/schema"
import { eq, inArray, and } from "drizzle-orm"

type ExperienceListOptions = {
  limit?: number
  page?: number
  tag?: string // also used as keyword: 会匹配标签、标题、公司名、岗位
  industry?: string
  type?: string
}

export async function getExperiencesList(options: ExperienceListOptions = {}) {
  const { limit = 20, page = 1, tag, industry, type } = options
  const supabase = await createServerSupabaseClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from("finance_experiences")
    .select(
      `
        id,
        slug,
        title,
        author_name,
        organization_name,
        article_type,
        job_title,
        tags,
        difficulty,
        read_time_minutes,
        view_count,
        like_count,
        comment_count,
        is_pinned,
        is_hot,
        publish_time,
        cover_asset_path,
        summary,
        industry
      `,
      { count: "estimated" }
    )

  const keyword = tag?.trim()
  if (industry) {
    query = query.eq("industry", industry)
  }

  if (type) {
    query = query.eq("article_type", type)
  }

  if (keyword) {
    // 支持标签 / 公司名 / 标题 / 岗位的模糊匹配，并保留对标签的精确包含
    const escaped = keyword.replace(/,/g, "\\,")
    query = query.or(
      [
        `tags.cs.{${escaped}}`,
        `title.ilike.%${escaped}%`,
        `organization_name.ilike.%${escaped}%`,
        `job_title.ilike.%${escaped}%`,
      ].join(",")
    )
  }

  const { data, error, count } = await query
    .order("is_pinned", { ascending: false })
    .order("is_hot", { ascending: false })
    .order("publish_time", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching experiences:", error)
    return { items: [], total: 0 }
  }

  // Fetch like status for current user
  let likedExperienceIds = new Set<string>()
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const userId = session?.user?.id

  if (userId && data && data.length > 0) {
    const ids = data.map(item => item.id)
    const likes = await db.query.userExperienceLikes.findMany({
      where: and(
        eq(userExperienceLikes.userId, userId),
        inArray(userExperienceLikes.experienceId, ids)
      ),
      columns: {
        experienceId: true
      }
    })
    likes.forEach(like => likedExperienceIds.add(like.experienceId))
  }

  return {
    items: (data || []).map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      author: {
        id: item.author_name || "author",
        name: item.author_name || "匿名",
      },
      type: item.article_type || "guide",
      company: item.organization_name
        ? { name: item.organization_name, logo: undefined }
        : undefined,
      jobTitle: item.job_title || undefined,
      tags: item.tags || [],
      difficulty: item.difficulty || undefined,
      readTime: item.read_time_minutes || undefined,
      viewCount: item.view_count || 0,
      likeCount: item.like_count || 0,
      commentCount: item.comment_count || 0,
      isPinned: item.is_pinned || false,
      isHot: item.is_hot || false,
      createdAt: item.publish_time || item.id,
      summary: item.summary,
      cover_asset_path: item.cover_asset_path,
      industry: item.industry || undefined,
      isLiked: likedExperienceIds.has(item.id),
    })),
    total: count || 0,
  }
}

export async function getExperienceBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("finance_experiences")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("Error fetching experience detail:", error)
    return null
  }

  // Fetch like status
  let isLiked = false
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const userId = session?.user?.id

  if (userId && data) {
    const like = await db.query.userExperienceLikes.findFirst({
      where: and(
        eq(userExperienceLikes.userId, userId),
        eq(userExperienceLikes.experienceId, data.id)
      )
    })
    if (like) isLiked = true
  }

  return { ...data, isLiked }
}
