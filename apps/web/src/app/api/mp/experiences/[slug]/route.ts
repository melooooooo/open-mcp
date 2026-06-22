import { createServerSupabaseClient } from "@/lib/supabase/server"
import { mapExperience } from "../../_shared/mappers"
import { fail, getCurrentUser, ok } from "../../_shared/response"
import { db } from "@repo/db"
import { financeExperiences, userExperienceLikes } from "@repo/db/schema"
import {
  markdownToCanonicalHtml,
  renderMiniProgramHtml,
  resolveExperienceSource,
  sanitizeCanonicalHtml,
} from "@repo/trpc/common/experience-content"
import { and, eq, sql } from "drizzle-orm"

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const decodedSlug = decodeURIComponent(slug)
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("finance_experiences").select("*").eq("slug", decodedSlug).maybeSingle()
  if (error || !data) return fail("NOT_FOUND", "经验不存在", 404)

  try {
    await db
      .update(financeExperiences)
      .set({ viewCount: sql`coalesce(${financeExperiences.viewCount}, 0) + 1` })
      .where(eq(financeExperiences.id, data.id))
  } catch {
    // 浏览量失败不影响详情阅读
  }

  const user = await getCurrentUser(request)
  let isLiked = false
  if (user?.id) {
    const like = await db.query.userExperienceLikes.findFirst({
      where: and(eq(userExperienceLikes.userId, user.id), eq(userExperienceLikes.experienceId, data.id)),
      columns: { id: true },
    })
    isLiked = Boolean(like)
  }

  const resolvedContent = resolveExperienceSource(data)
  const canonicalHtml =
    resolvedContent.format === "markdown"
      ? await markdownToCanonicalHtml(resolvedContent.value)
      : sanitizeCanonicalHtml(resolvedContent.value)
  const renderedContent = renderMiniProgramHtml(canonicalHtml, {
    title: data.title,
    coverAssetPath: data.cover_asset_path,
  })

  return ok({
    ...mapExperience(data),
    // 兼容旧版小程序；新版统一使用 contentHtml。
    content: resolvedContent.value,
    contentType: resolvedContent.format,
    contentHtml: renderedContent.html,
    relatedLinks: renderedContent.relatedLinks,
    isLiked,
  })
}
