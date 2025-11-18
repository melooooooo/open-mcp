#!/usr/bin/env node
/**
 * Parse WeChat-exported bank-info articles into finance_experiences table.
 * - Reads BANK_INFO_ROOT (default /Users/jiang/Desktop/bank-info) for directory index.html files
 * - Extracts title, publish time/location, cover, content HTML/text
 * - Derives slug, industry, tags, summary, read_time_minutes, sections, salary highlights
 * - Upserts into Supabase via DATABASE_URL using pg
 */

import fs from "node:fs/promises"
import path from "node:path"
import dotenv from "dotenv"
import { Client } from "pg"

const MAX_SUMMARY_LEN = 200
const WORDS_PER_MINUTE = 420 // rough estimate for Chinese characters per minute
const DEFAULT_BANK_INFO_DIR = process.env.BANK_INFO_ROOT || "/Users/jiang/Desktop/bank-info"
const BANK_INFO_ROOT = path.resolve(DEFAULT_BANK_INFO_DIR)
const OUTPUT_JSON = path.resolve(process.env.OUTPUT_JSON || path.join("analysis", "finance-experiences.json"))
const SKIP_DB = process.argv.includes("--dry-run") || process.env.SKIP_DB === "1"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required (expected in .env.local)")
  process.exit(1)
}

const industryMap = [
  { key: "银行", value: "bank" },
  { key: "农行", value: "bank" },
  { key: "工行", value: "bank" },
  { key: "建行", value: "bank" },
  { key: "招行", value: "bank" },
  { key: "证券", value: "securities" },
  { key: "券", value: "securities" },
  { key: "信托", value: "securities" },
  { key: "保险", value: "insurance" },
  { key: "人保", value: "insurance" },
  { key: "人寿", value: "insurance" },
  { key: "运营商", value: "operator" },
  { key: "电信", value: "operator" },
  { key: "移动", value: "operator" },
  { key: "联通", value: "operator" },
  { key: "科技", value: "technology" },
]

const cleanWhitespace = (text = "") => text.replace(/\s+/g, " ").trim()
const stripBrackets = (text = "") =>
  text
    .replace(/[【】\[\]（）()「」《》<>]/g, " ")
    .replace(/[“”‘’]/g, "")
    .replace(/:+/g, " ")
    .replace(/\s+/g, " ")

const toSlug = (raw) => {
  const name = cleanWhitespace(raw || "")
  const slug = name
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-")
    .replace(/-+/g, "-")
    .replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5]/g, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "")
  if (slug) return slug
  return `experience-${Buffer.from(raw || "x").toString("hex").slice(0, 6)}`
}

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const findBetween = (html, regex) => {
  const m = html.match(regex)
  return m ? cleanWhitespace(m[1]) : ""
}

const extractDivById = (html, id) => {
  const startRe = new RegExp(`<div[^>]*id=["']${id}["'][^>]*>`, "i")
  const startMatch = startRe.exec(html)
  if (!startMatch) return ""

  const startIndex = startMatch.index
  let cursor = startMatch.index + startMatch[0].length
  let depth = 1
  const divRe = /<\/?div\b[^>]*>/gi
  divRe.lastIndex = cursor
  let match

  while ((match = divRe.exec(html))) {
    const token = match[0]
    if (token.startsWith("</")) {
      depth -= 1
    } else {
      depth += 1
    }
    cursor = match.index + match[0].length
    if (depth === 0) {
      return html.slice(startIndex, cursor)
    }
  }
  return ""
}

const uniq = (items) => Array.from(new Set(items.filter(Boolean)))

const guessIndustry = (title, dirname) => {
  const source = `${title} ${dirname}`
  for (const item of industryMap) {
    if (source.includes(item.key)) return item.value
  }
  return "other"
}

const guessOrganization = (title, dirname) => {
  const sanitizedTitle = stripBrackets(title)
  const match = sanitizedTitle.match(/(.+?)(待遇|校招|揭秘|大曝光|信息科技|总行|研发中心|校园招聘|招聘|曝光)/)
  let candidate = match ? match[1] : sanitizedTitle
  candidate = cleanWhitespace(candidate.replace(/[-—_]/g, " "))
  if (!candidate || candidate.length < 2) {
    candidate = cleanWhitespace(stripBrackets(dirname).replace(/[-_]/g, " "))
  }
  if (!candidate || candidate.length < 2) {
    candidate = cleanWhitespace(stripBrackets(title))
  }
  return candidate
}

const deriveTags = (title, industry, dirname, content) => {
  const tags = new Set()
  if (industry && industry !== "other") tags.add(industry)
  if (/校招|校园|管培|2025/.test(title)) tags.add("校招")
  if (/待遇|薪|包|年终|补/.test(title)) tags.add("薪资待遇")
  if (/科技|信息|研发|开发|数据中心/.test(title)) tags.add("技术岗")
  if (/银行|券|保险|人保|人寿/.test(title)) tags.add("金融")
  if (/网友投稿/.test(dirname)) tags.add("网友投稿")
  if (/面经|面试/.test(title)) tags.add("面经")
  if (/国央企|央企|国企/.test(content)) tags.add("国央企")
  return Array.from(tags)
}

const deriveSummary = (text) => text.slice(0, MAX_SUMMARY_LEN)

const parsePublishTime = (text) => {
  const cleaned = cleanWhitespace(text)
  if (!cleaned) return null
  const numeric = cleaned.replace(/[年月]/g, "-").replace(/[日]/, "").replace(/\s+/g, " ").trim()
  const isoCandidate = numeric.replace(" ", "T")
  const date = new Date(isoCandidate)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const extractContent = (html) => {
  const wrapper = extractDivById(html, "js_content") || ""
  if (!wrapper) return { contentHtml: "", contentText: "" }
  const contentHtml = wrapper
    .replace(/^<div[^>]*id=["']js_content["'][^>]*>/i, "")
    .replace(/<\/div>\s*$/, "")
  const contentText = stripTags(contentHtml)
  return { contentHtml, contentText }
}

const headingRegex = /^([一二三四五六七八九十]+[、\.．]|第[一二三四五六七八九十]|【|「|《).+/
const isHeadingParagraph = (text) =>
  headingRegex.test(text) || (/公司|薪|福利|待遇|招聘|岗位|总结|亮点/.test(text) && text.length <= 20)

const buildSections = (contentHtml) => {
  const paragraphMatches = contentHtml.match(/<p[\s\S]*?<\/p>/gi)
  if (!paragraphMatches) {
    return [
      {
        order: 1,
        title: "正文",
        body_html: contentHtml,
        body_text: stripTags(contentHtml),
        raw_heading: null,
      },
    ]
  }

  const sections = []
  let current = { title: "导语", htmlParts: [], raw: null }

  const pushCurrent = () => {
    if (!current.htmlParts.length) return
    const html = current.htmlParts.join("\n")
    sections.push({
      order: sections.length + 1,
      title: current.title || `部分${sections.length + 1}`,
      body_html: html,
      body_text: stripTags(html),
      raw_heading: current.raw,
    })
    current = { title: null, htmlParts: [], raw: null }
  }

  for (const fragment of paragraphMatches) {
    const text = cleanWhitespace(stripTags(fragment))
    if (!text && !/img/i.test(fragment)) continue
    if (isHeadingParagraph(text)) {
      pushCurrent()
      current.title = text.replace(/^[【「《]|[】」》]$/g, "")
      current.raw = text
      continue
    }
    if (!current.title) current.title = sections.length === 0 ? "导语" : `部分${sections.length + 1}`
    current.htmlParts.push(fragment)
  }

  pushCurrent()
  return sections
}

const pickSalaryHighlights = (text) => {
  const sentences = text.split(/(?<=[。！？!?.])/).map((s) => cleanWhitespace(s)).filter(Boolean)
  const hits = sentences.filter((s) => /(\d+\s*(k|K|w|W|万)|薪|补贴|年终|奖金|绩效|津贴|补助|到手)/.test(s))
  const allowances = hits.filter((s) => /补贴|补助|津贴|餐|房|交通|通信/.test(s))
  const bonuses = hits.filter((s) => /年终|奖金|绩效|13薪|14薪|15薪|16薪/.test(s))
  const figures = Array.from(text.matchAll(/\d+(?:\.\d+)?\s*(?:k|K|w|W|万)/g)).map((m) => m[0])
  if (!hits.length && !figures.length) return null
  return {
    sentences: hits.slice(0, 8),
    allowances: allowances.slice(0, 5),
    bonuses: bonuses.slice(0, 5),
    figures: figures.slice(0, 8),
  }
}

const detectArticleType = (title, content) => {
  if (/面经|面试|问答/.test(title) || /面试/.test(content.slice(0, 200))) return "interview"
  if (/点评|测评/.test(title)) return "review"
  return "guide"
}

const guessJobTitle = (title, dirname) => {
  const source = `${title} ${dirname}`
  if (/信息科技|信息技术/.test(source)) return "信息科技岗"
  if (/软件开发|软件中心/.test(source)) return "软件开发"
  if (/网络科技/.test(source)) return "网络科技"
  if (/研发中心|研发部/.test(source)) return "研发中心"
  if (/数据中心/.test(source)) return "数据中心"
  if (/管培/.test(source)) return "管培生"
  if (/运营|运营商/.test(source)) return "运营岗位"
  return null
}

async function loadArticles() {
  const entries = await fs.readdir(BANK_INFO_ROOT, { withFileTypes: true })
  const dirs = entries.filter((e) => e.isDirectory())
  const records = []

  for (const dir of dirs) {
    const indexPath = path.join(BANK_INFO_ROOT, dir.name, "index.html")
    try {
      const html = await fs.readFile(indexPath, "utf8")
      const title =
        findBetween(html, /id=["']activity-name["'][^>]*>\s*([^<]+)\s*</i) ||
        findBetween(html, /<title>([^<]+)<\/title>/i)
      if (!title) {
        console.warn(`Skip ${dir.name}: missing title`)
        continue
      }
      const publishTimeRaw = findBetween(html, /id=["']publish_time["'][^>]*>\s*([^<]+)\s*</i)
      const publishLocation = findBetween(html, /id=["']js_ip_wording["'][^>]*>\s*([^<]+)\s*</i)
      const authorName = findBetween(html, /id=["']js_name["'][^>]*>\s*([^<]+)\s*</i)
      const coverAssetPath = findBetween(
        html,
        /id=["']js_row_immersive_cover_img["'][\s\S]*?<img[^>]*src=["']([^"']+)["']/i
      )

      const { contentHtml, contentText } = extractContent(html)
      if (!contentHtml) {
        console.warn(`Skip ${dir.name}: missing content`)
        continue
      }

      const industry = guessIndustry(title, dir.name)
      const tags = deriveTags(title, industry, dir.name, contentText)
      const summary = deriveSummary(contentText)
      const readTimeMinutes = Math.max(1, Math.ceil(contentText.length / WORDS_PER_MINUTE))
      const organizationName = guessOrganization(title, dir.name)
      const slug = toSlug(dir.name || title)
      const sections = buildSections(contentHtml)
      const salaryHighlights = pickSalaryHighlights(contentText)
      const article_type = detectArticleType(title, contentText)
      const job_title = guessJobTitle(title, dir.name)
      const sourcePath = path.relative(process.cwd(), indexPath)
      const coverPath =
        coverAssetPath && !coverAssetPath.startsWith("http")
          ? path
            .relative(
              process.cwd(),
              path.resolve(path.join(BANK_INFO_ROOT, dir.name), coverAssetPath.replace(/^\.\//, ""))
            )
            .replace(/\\/g, "/")
          : coverAssetPath || null

      records.push({
        slug,
        title,
        author_name: authorName || null,
        organization_name: organizationName || null,
        organization_alias: uniq([organizationName, dir.name.replace(/_/g, ""), title]),
        industry,
        article_type,
        job_title,
        region: publishLocation || null,
        publish_time: parsePublishTime(publishTimeRaw),
        publish_location: publishLocation || null,
        source_path: sourcePath,
        cover_asset_path: coverPath,
        summary,
        tags,
        difficulty: 3,
        read_time_minutes: readTimeMinutes,
        salary_highlights: salaryHighlights,
        sections,
        content_html: contentHtml,
        content_text: contentText,
        metadata: {
          publish_location: publishLocation || null,
          publish_time_text: publishTimeRaw || null,
          directory_name: dir.name,
          estimated_word_count: contentText.length,
          generated_at: new Date().toISOString(),
        },
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        is_pinned: false,
        is_hot: false,
        status: "published",
      })
    } catch (err) {
      console.error(`Failed to parse ${indexPath}:`, err)
    }
  }
  return records
}

async function upsert(records) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  const columns = [
    "slug",
    "title",
    "author_name",
    "organization_name",
    "organization_alias",
    "industry",
    "article_type",
    "job_title",
    "region",
    "publish_time",
    "publish_location",
    "source_path",
    "cover_asset_path",
    "summary",
    "tags",
    "difficulty",
    "read_time_minutes",
    "salary_highlights",
    "sections",
    "content_html",
    "content_text",
    "metadata",
    "view_count",
    "like_count",
    "comment_count",
    "is_pinned",
    "is_hot",
    "status",
  ]

  const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(", ")
  const updateAssignments = columns
    .filter((col) => col !== "slug")
    .map((col) => `${col} = EXCLUDED.${col}`)
    .join(", ")

  const sql = `
    INSERT INTO finance_experiences (${columns.join(", ")})
    VALUES (${placeholders})
    ON CONFLICT (slug) DO UPDATE SET ${updateAssignments};
  `

  for (const record of records) {
    const values = columns.map((c) => {
      const value = record[c]
      // Handle JSONB fields - serialize to JSON string
      if (
        (c === "salary_highlights" || c === "sections" || c === "metadata") &&
        value !== null &&
        value !== undefined
      ) {
        return JSON.stringify(value)
      }
      // Handle PostgreSQL array fields - keep as JavaScript array
      // pg library will automatically convert JS arrays to PostgreSQL arrays
      if ((c === "organization_alias" || c === "tags") && value !== null && value !== undefined) {
        return value // Keep as array
      }
      return value
    })
    await client.query(sql, values)
    console.log(`Upserted ${record.slug}`)
  }

  await client.end()
}

async function main() {
  const records = await loadArticles()
  console.log(`Parsed ${records.length} articles from ${BANK_INFO_ROOT}`)
  if (!records.length) {
    console.warn("No articles parsed, aborting.")
    process.exit(1)
  }
  await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true })
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(records, null, 2), "utf8")
  console.log(`Structured data written to ${OUTPUT_JSON}`)
  if (SKIP_DB) {
    console.log("SKIP_DB enabled, skip inserting into Supabase.")
    return
  }
  await upsert(records)
  console.log("Inserted to finance_experiences.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
