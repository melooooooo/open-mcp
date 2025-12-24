
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve('/Users/jiang/develop/GitHub/open-mcp/apps/web/.env')
dotenv.config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- Helper Functions Copied from ingest script ---

const cleanWhitespace = (text = "") => text.replace(/\s+/g, " ").trim()

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

const headingRegex = /^([一二三四五六七八九十]+[、\.．]|第[一二三四五六七八九十]|【|「|《).+/
const isHeadingParagraph = (text) =>
  headingRegex.test(text) || (/公司|薪|福利|待遇|招聘|岗位|总结|亮点/.test(text) && text.length <= 20)

const createAnchorGenerator = () => {
  const counter = new Map()
  return (title, fallbackIndex = 1) => {
    const base = toSlug(title || "") || `section-${fallbackIndex}`
    const seen = counter.get(base) || 0
    counter.set(base, seen + 1)
    return seen === 0 ? base : `${base}-${seen + 1}`
  }
}

const buildSectionsFromHtml = (contentHtml) => {
  if (!contentHtml) return []
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

async function main() {
  console.log('Fetching all experiences...')

  // Only process if sections is null or has length <= 1
  // Supabase doesn't easily support JSON length filtering in regular select, so we fetch all 
  // (optimally we would filter, but dataset size is small enough)
  const { data: experiences, error } = await supabase
    .from('finance_experiences')
    .select('id, title, slug, sections, content_html')
    .ilike('title', '%网联清算%') // Target specific one first for safety, remove later for all

  if (error) {
    console.error('Error fetching experiences:', error)
    return
  }

  console.log(`Found ${experiences.length} experiences to check.`)

  for (const exp of experiences) {
    const currentSections = Array.isArray(exp.sections) ? exp.sections : []

    // Only regenerate if we have bad sections (<=1) and good HTML
    if (currentSections.length <= 1 && exp.content_html && exp.content_html.length > 500) {
      console.log(`Processing: ${exp.title} (Current Sections: ${currentSections.length})`)

      const newSections = buildSectionsFromHtml(exp.content_html)

      if (newSections.length > 1) {
        console.log(`  -> Improved! Generated ${newSections.length} sections. Updating DB...`)
        const { error: updateError } = await supabase
          .from('finance_experiences')
          .update({ sections: newSections })
          .eq('id', exp.id)

        if (updateError) {
          console.error(`  -> Update failed:`, updateError)
        } else {
          console.log(`  -> Update successful.`)
        }
      } else {
        console.log(`  -> No improvement (Generated ${newSections.length} sections). Skipping.`)
      }
    } else {
      console.log(`Skipping: ${exp.title} (Sections: ${currentSections.length}, HTML: ${exp.content_html?.length})`)
    }
  }
}

main()
