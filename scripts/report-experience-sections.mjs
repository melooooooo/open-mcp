#!/usr/bin/env node
/**
 * Report section quality and potential improvements.
 *
 * Usage:
 *   node scripts/report-experience-sections.mjs
 *   node scripts/report-experience-sections.mjs --limit=50
 *   node scripts/report-experience-sections.mjs --slug=example-slug
 *   node scripts/report-experience-sections.mjs --sample=10
 */

import path from "node:path"
import dotenv from "dotenv"
import { Client } from "pg"
import { marked } from "marked"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

marked.setOptions({
  mangle: false,
  headerIds: false,
  breaks: true,
})

const slugArg = process.argv.find((arg) => arg.startsWith("--slug="))?.split("=")[1]
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1]
const sampleArg = process.argv.find((arg) => arg.startsWith("--sample="))?.split("=")[1]
const limit = limitArg ? Number.parseInt(limitArg, 10) : null
const sampleSize = sampleArg ? Number.parseInt(sampleArg, 10) : 10

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required (expected in .env.local)")
  process.exit(1)
}

const MIN_MEANINGFUL_SECTION_LEN = 60

const cleanWhitespace = (text = "") => text.replace(/\s+/g, " ").trim()

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const headingRegex = /^([一二三四五六七八九十]+[、\.．]|第[一二三四五六七八九十]|【|「|《).+/
const isHeadingParagraph = (text) =>
  headingRegex.test(text) || (/公司|薪|福利|待遇|招聘|岗位|总结|亮点/.test(text) && text.length <= 20)

const normalizeMarkdownHeadings = (markdown) => {
  if (!markdown) return markdown
  const lines = markdown.split(/\r?\n/)
  const output = []
  let inCodeBlock = false

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const trimmed = line.trim()
    const nextLine = lines[i + 1]?.trim() ?? ""

    if (/^```|^~~~/.test(trimmed)) {
      inCodeBlock = !inCodeBlock
      output.push(line)
      continue
    }

    if (inCodeBlock) {
      output.push(line)
      continue
    }

    if (!trimmed) {
      output.push(line)
      continue
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      output.push(line)
      continue
    }

    if (/^!\[/.test(trimmed) || /^>/.test(trimmed)) {
      output.push(line)
      continue
    }

    if (/^(\*|-|\+)\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      output.push(line)
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      output.push(line)
      continue
    }

    if (/^=+$/.test(nextLine) || /^-+$/.test(nextLine)) {
      output.push(line)
      continue
    }

    if (isHeadingParagraph(trimmed) && trimmed.length <= 40) {
      output.push(`## ${trimmed}`)
      continue
    }

    output.push(line)
  }

  return output.join("\n")
}

const createAnchorGenerator = () => {
  const counter = new Map()
  return (title, fallbackIndex = 1) => {
    const base = cleanWhitespace(title || "")
      .replace(/\s+/g, "-")
      .replace(/_+/g, "-")
      .replace(/-+/g, "-")
      .replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5]/g, "-")
      .toLowerCase()
      .replace(/^-+|-+$/g, "") || `section-${fallbackIndex}`
    const seen = counter.get(base) || 0
    counter.set(base, seen + 1)
    return seen === 0 ? base : `${base}-${seen + 1}`
  }
}

const cloneTokens = (tokens = []) => {
  if (typeof structuredClone === "function") return structuredClone(tokens)
  return JSON.parse(JSON.stringify(tokens))
}

const renderTokensHtml = (tokens, links) => {
  if (!tokens.length) return ""
  const cloned = cloneTokens(tokens)
  cloned.links = links
  return marked.parser(cloned)
}

const buildSectionsFromMarkdown = (markdown) => {
  if (!markdown || !markdown.trim()) return []
  const normalized = normalizeMarkdownHeadings(markdown)
  const tokens = marked.lexer(normalized)
  const links = tokens.links || {}
  const sections = []
  const anchorGen = createAnchorGenerator()

  let skippedTopHeading = false
  let current = { title: "导语", tokens: [], raw: null, depth: 1, anchor: null }

  const pushCurrent = () => {
    if (!current.tokens.length) return
    const html = renderTokensHtml(current.tokens, links)
    if (!html.trim()) {
      current = { title: null, tokens: [], raw: null, depth: null, anchor: null }
      return
    }
    sections.push({
      order: sections.length + 1,
      title: current.title || `部分${sections.length + 1}`,
      body_html: html,
      body_text: stripTags(html),
      raw_heading: current.raw,
      depth: current.depth || null,
      anchor: current.anchor || null,
    })
    current = { title: null, tokens: [], raw: null, depth: null, anchor: null }
  }

  for (const token of tokens) {
    if (token.type === "heading") {
      const text = cleanWhitespace(token.text || "")
      if (token.depth === 1 && !skippedTopHeading) {
        skippedTopHeading = true
        continue
      }
      pushCurrent()
      current.title = text || `部分${sections.length + 1}`
      current.raw = text
      current.depth = token.depth
      current.anchor = anchorGen(text, sections.length + 1)
      current.tokens = []
      continue
    }
    current.tokens.push(token)
  }

  pushCurrent()
  return sections
}

const buildSectionsFromHtml = (contentHtml) => {
  if (!contentHtml || !contentHtml.trim()) return []
  const blockMatches = contentHtml.match(/<(p|h[1-6]|blockquote|ul|ol|pre)[\s\S]*?<\/\1>/gi)
  if (!blockMatches) {
    return [
      {
        order: 1,
        title: "正文",
        body_html: contentHtml,
        body_text: stripTags(contentHtml),
        raw_heading: null,
        depth: null,
        anchor: null,
      },
    ]
  }

  const sections = []
  const anchorGen = createAnchorGenerator()
  let current = { title: "导语", htmlParts: [], raw: null, anchor: null, depth: null }
  let skippedTopHeading = false

  const pushCurrent = () => {
    if (!current.htmlParts.length) return
    const html = current.htmlParts.join("\n")
    sections.push({
      order: sections.length + 1,
      title: current.title || `部分${sections.length + 1}`,
      body_html: html,
      body_text: stripTags(html),
      raw_heading: current.raw,
      anchor: current.anchor,
      depth: current.depth,
    })
    current = { title: null, htmlParts: [], raw: null, anchor: null, depth: null }
  }

  for (const fragment of blockMatches) {
    const text = cleanWhitespace(stripTags(fragment))
    if (!text && !/img/i.test(fragment)) continue

    const tagMatch = fragment.match(/^<([a-z0-9]+)/i)
    const tagName = tagMatch ? tagMatch[1].toLowerCase() : "p"
    const headingLevel = tagName.startsWith("h") ? Number(tagName.replace("h", "")) : null
    const isHeadingTag = typeof headingLevel === "number" && Number.isFinite(headingLevel)
    if (isHeadingTag && headingLevel === 1 && !skippedTopHeading) {
      skippedTopHeading = true
      continue
    }

    const shouldStartSection =
      (tagName === "p" && isHeadingParagraph(text)) || (isHeadingTag && headingLevel >= 2)

    if (shouldStartSection) {
      pushCurrent()
      current.title = text.replace(/^[【「《]|[】」》]$/g, "")
      current.raw = text
      current.anchor = anchorGen(current.title, sections.length + 1)
      current.depth = headingLevel || null
      continue
    }
    if (!current.title) current.title = sections.length === 0 ? "导语" : `部分${sections.length + 1}`
    current.htmlParts.push(fragment)
  }

  pushCurrent()
  return sections
}

const getSectionText = (section) => {
  if (!section) return ""
  if (section.body_text) return cleanWhitespace(section.body_text)
  if (section.body_html) return cleanWhitespace(stripTags(section.body_html))
  return ""
}

const scoreSections = (sections = []) => {
  if (!Array.isArray(sections) || sections.length === 0) {
    return { score: 0, meaningful: 0, titled: 0, count: 0 }
  }
  let meaningful = 0
  let titled = 0
  for (const section of sections) {
    const text = getSectionText(section)
    if (text.length >= MIN_MEANINGFUL_SECTION_LEN) meaningful += 1
    if (cleanWhitespace(section?.title || "").length > 0) titled += 1
  }
  const count = sections.length
  const score = meaningful * 1000 + titled * 10 + count
  return { score, meaningful, titled, count }
}

const pickBestSections = (markdownSections = [], htmlSections = []) => {
  if (!markdownSections.length) return htmlSections
  if (!htmlSections.length) return markdownSections

  if (markdownSections.length <= 1 && htmlSections.length > 1) return htmlSections
  if (htmlSections.length <= 1 && markdownSections.length > 1) return markdownSections

  const mdStats = scoreSections(markdownSections)
  const htmlStats = scoreSections(htmlSections)

  if (mdStats.meaningful === 0 && htmlStats.meaningful > 0) return htmlSections
  if (htmlStats.meaningful === 0 && mdStats.meaningful > 0) return markdownSections

  if (htmlStats.score === mdStats.score) return markdownSections
  return htmlStats.score > mdStats.score ? htmlSections : markdownSections
}

const buildSections = ({ contentHtml, markdown }) => {
  const htmlSections = buildSectionsFromHtml(contentHtml)
  if (markdown) {
    const markdownSections = buildSectionsFromMarkdown(markdown)
    if (markdownSections.length) return pickBestSections(markdownSections, htmlSections)
  }
  return htmlSections
}

const parseJson = (value) => {
  if (!value) return null
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return value
}

const renderMarkdownToHtml = async (markdown) => {
  const rendered = marked.parse(markdown)
  return typeof rendered === "string" ? rendered : await rendered
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const main = async () => {
  await client.connect()

  const conditions = []
  const values = []
  if (slugArg) {
    values.push(slugArg)
    conditions.push(`slug = $${values.length}`)
  }

  let query = `
    SELECT id, slug, markdown_content, content_html, metadata, sections
    FROM finance_experiences
  `
  if (conditions.length) {
    query += ` WHERE ${conditions.join(" AND ")}`
  }
  query += " ORDER BY publish_time DESC NULLS LAST"
  if (limit && Number.isFinite(limit)) {
    query += ` LIMIT ${limit}`
  }

  const result = await client.query(query, values)
  const rows = result.rows || []

  let existingSingle = 0
  let nextMulti = 0
  let improved = 0
  let degraded = 0

  const samples = []

  for (const row of rows) {
    const metadata = parseJson(row.metadata) || {}
    const markdown =
      row.markdown_content ||
      metadata?.markdown_source?.content ||
      null
    let contentHtml = row.content_html
    if (!contentHtml && markdown) {
      contentHtml = await renderMarkdownToHtml(markdown)
    }
    if (!contentHtml && !markdown) {
      continue
    }

    const nextSections = buildSections({ contentHtml: contentHtml || "", markdown })
    const existingSections = Array.isArray(row.sections) ? row.sections : parseJson(row.sections) || []

    const existingCount = existingSections.length
    const nextCount = nextSections.length

    if (existingCount <= 1) existingSingle += 1
    if (nextCount > 1) nextMulti += 1
    if (nextCount > existingCount) improved += 1
    if (nextCount < existingCount) degraded += 1

    if (nextCount !== existingCount) {
      samples.push({
        slug: row.slug || row.id,
        existing: existingCount,
        next: nextCount,
        delta: nextCount - existingCount,
      })
    }
  }

  samples.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  console.log(`total=${rows.length}`)
  console.log(`existing<=1=${existingSingle}`)
  console.log(`next>1=${nextMulti}`)
  console.log(`improved=${improved}`)
  console.log(`degraded=${degraded}`)

  if (samples.length > 0) {
    console.log(`top changes (showing ${Math.min(sampleSize, samples.length)}):`)
    for (const sample of samples.slice(0, sampleSize)) {
      console.log(`- ${sample.slug}: ${sample.existing} -> ${sample.next} (delta ${sample.delta})`)
    }
  }

  await client.end()
}

main().catch((err) => {
  console.error("failed:", err)
  process.exit(1)
})
