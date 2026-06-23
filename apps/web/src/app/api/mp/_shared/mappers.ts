import { buildExperienceExcerpt } from "@repo/trpc/common/experience-content"
import { normalizeDate } from "./response"

// 将 Markdown / HTML 片段转成纯文本摘要：剥离图片、链接、标题、强调等标记，
// 仅用于列表卡片的 summary 展示；详情页正文走独立的 md→html 渲染管线，不受影响。
export function markdownToPlainText(value?: string | null, maxLength = 120) {
  if (!value) return ""
  const text = String(value)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/!?\[[^\]]*\]\[[^\]]*\]/g, " ")
    .replace(/<https?:\/\/[^>]*>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}\d+\.\s+/gm, "")
    .replace(/^\s{0,3}([-*_])\s*(?:\1\s*){2,}$/gm, " ")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
  return text.replace(/\s+/g, " ").trim().slice(0, maxLength)
}

export function mapJobListing(row: any) {
  return {
    id: row.id,
    title: row.job_title || row.jobTitle || "未命名职位",
    company: row.company_name || row.companyName || "未知公司",
    location: row.work_location || row.workLocation || "地点未明确",
    companyType: row.company_type || row.companyType || "其他",
    industry: row.industry_category || row.industryCategory || "未明确",
    deadline: row.deadline || null,
    session: row.session || "",
    degreeRequirement: row.degree_requirement || row.degreeRequirement || "",
    batch: row.batch || "",
    applicationMethod: row.application_method || row.applicationMethod || "",
    remark: row.remark || "",
    majorRequirement: row.major_requirement || row.majorRequirement || "",
    hasWrittenTest: row.has_written_test || row.hasWrittenTest || "",
    referralCode: row.referral_code || row.referralCode || "",
    announcementSource: row.announcement_source || row.announcementSource || "",
    sourceUpdatedAt: row.source_updated_at || row.sourceUpdatedAt || null,
    createdAt: row.created_at || row.createdAt || null,
    tags: [
      row.session,
      row.company_type || row.companyType,
      row.industry_category || row.industryCategory,
    ].filter(Boolean),
  }
}

export function mapJobSite(row: any) {
  return {
    id: row.id,
    title: row.title || row.name || "未知来源",
    description: row.description || row.department || "优质招聘渠道",
    logo: row.company_logo || row.logo || null,
    companyName: row.company_name || null,
    websiteUrl: row.website_url || row.websiteUrl || row.url || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    location: row.location || [],
    viewCount: row.view_count || row.viewCount || 0,
    createdAt: row.created_at || row.createdAt || null,
  }
}

export function mapExperience(row: any) {
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title || "未命名经验",
    authorName: row.author_name || row.authorName || "匿名",
    organizationName: row.organization_name || row.organizationName || "",
    articleType: row.article_type || row.articleType || "guide",
    jobTitle: row.job_title || row.jobTitle || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    difficulty: row.difficulty || "",
    readTimeMinutes: row.read_time_minutes || row.readTimeMinutes || null,
    viewCount: row.view_count || row.viewCount || 0,
    likeCount: row.like_count || row.likeCount || 0,
    commentCount: row.comment_count || row.commentCount || 0,
    isPinned: Boolean(row.is_pinned || row.isPinned),
    isHot: Boolean(row.is_hot || row.isHot),
    publishTime: row.publish_time || row.publishTime || null,
    coverAssetPath: row.cover_asset_path || row.coverAssetPath || "",
    summary: markdownToPlainText(
      row.summary || row.content_html || row.contentHtml || row.markdown_content || row.markdownContent || "",
      120
    ),
    industry: row.industry || "",
  }
}

// 列表/首页/搜索统一使用：在 mapExperience 基础上，用正文源生成干净纯文本摘要覆盖 summary。
// 正文为空时回落到 mapExperience 已清洗的 summary，保证不劣化。
export async function mapExperienceWithExcerpt(row: any) {
  const base = mapExperience(row)
  const excerpt = await buildExperienceExcerpt(
    row,
    { title: row.title, coverAssetPath: row.cover_asset_path || row.coverAssetPath || "" },
    120
  )
  return { ...base, summary: excerpt || base.summary }
}

export function mapReferral(row: any) {
  return {
    id: row.id,
    title: row.title || "未命名内推",
    link: row.link || "",
    content: row.content || "",
    author: row.author || "",
    replyCount: row.reply_count ?? row.replyCount ?? 0,
    publishDate: row.publish_date || row.publishDate || "",
    source: row.source || "",
    companyName: row.company_name || row.companyName || "",
    jobType: row.job_type || row.jobType || "",
    location: row.location || "",
    salary: row.salary || "",
    createdAt: row.created_at || row.createdAt || null,
    updatedAt: row.updated_at || row.updatedAt || null,
  }
}

export function relativeTime(value?: string | Date | null) {
  if (!value) return "近期"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days <= 0) return "今天"
  if (days === 1) return "昨天"
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return normalizeDate(date) || "近期"
}

