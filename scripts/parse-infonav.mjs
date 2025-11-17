import fs from 'fs'
import path from 'path'

const filePath = path.resolve('scripts/infonav.txt')
const text = fs.readFileSync(filePath, 'utf8')
const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
const entries = []
for (const line of lines) {
  if (line.startsWith('平台名称')) continue
  const parts = line.split(',')
  if (parts.length < 5) continue
  const [name, rawUrl, audience, desc, highlight] = parts.map((p) => p.trim())
  const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return rawUrl
    }
  })()
  const tagMap = {
    '校招': ['campus'],
    '社招': ['fulltime'],
    '两者': ['campus', 'fulltime'],
  }
  const tags = tagMap[audience] ? [...tagMap[audience]] : []
  const description = `${desc}${highlight ? ` ${highlight}` : ''}`.trim()
  entries.push({
    name,
    url,
    domain,
    tags,
    audience,
    description,
  })
}
const unique = []
const seen = new Set()
for (const item of entries) {
  const key = item.domain.toLowerCase()
  if (seen.has(key)) continue
  seen.add(key)
  unique.push(item)
}
console.log(JSON.stringify(unique, null, 2))
