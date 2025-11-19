import { notFound } from "next/navigation"
import Link from "next/link"
import sanitizeHtml from "sanitize-html"
import { getExperienceBySlug } from "@/lib/api/experiences"
import { Container } from "@/components/web/container"
import { Badge } from "@repo/ui/components/ui/badge"

// Configure sanitize-html options
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "span",
    "strong",
    "em",
    "ul",
    "ol",
    "li",
    "br",
    "blockquote",
    "code",
    "pre",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "img",
    "a",
    "hr",
    "figure",
    "figcaption",
    "div",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title"],
    p: ["style"],
    span: ["style"],
    div: ["style"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
}

// Helper function to sanitize HTML content
function sanitize(html?: string | null): string {
  if (!html) return ""
  return sanitizeHtml(html, sanitizeOptions)
}

type ExperienceDetailPageProps = {
  params: Promise<{ slug: string }>
}

export default async function ExperienceDetailPage({ params }: ExperienceDetailPageProps) {
  const resolvedParams = await params
  // URL decode the slug to handle Chinese characters
  const decodedSlug = decodeURIComponent(resolvedParams.slug)
  const experience = await getExperienceBySlug(decodedSlug)

  if (!experience) {
    notFound()
  }

  const sections = Array.isArray(experience.sections) ? experience.sections : []
  const salary = experience.salary_highlights || {}

  return (
    <main className="bg-background min-h-screen py-10">
      <Container className="max-w-3xl space-y-8">
        <Link href="/experiences" className="text-sm text-primary hover:underline">
          ← 返回经验列表
        </Link>

        <article className="space-y-6">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {experience.article_type && (
                <Badge variant="outline">{experience.article_type === "guide" ? "攻略" : experience.article_type}</Badge>
              )}
              {experience.organization_name && (
                <span>公司：{experience.organization_name}</span>
              )}
              {experience.job_title && <span>岗位：{experience.job_title}</span>}
              {experience.publish_time && (
                <span>发布时间：{new Date(experience.publish_time).toLocaleDateString()}</span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{experience.title}</h1>
            {experience.summary && (
              <p className="text-muted-foreground">{experience.summary}</p>
            )}
          </header>

          {experience.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {experience.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {salary.sentences && (
            <section className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <h2 className="text-lg font-semibold">薪酬亮点</h2>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                {salary.sentences.slice(0, 6).map((line: string, index: number) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-8">
            {sections.length > 0 ? (
              sections.map((section: any) => (
                <div key={section.order} className="space-y-3">
                  {section.title && (
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                  )}
                  <div
                    className="prose prose-neutral dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitize(section.body_html) }}
                  />
                </div>
              ))
            ) : (
              <div
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitize(experience.content_html) }}
              />
            )}
          </section>

          <footer className="border-t pt-4 text-sm text-muted-foreground">
            <p>发布地点：{experience.publish_location || "未知"}</p>
            {experience.view_count !== undefined && (
              <p>浏览量：{experience.view_count}</p>
            )}
          </footer>
        </article>
      </Container>
    </main>
  )
}
