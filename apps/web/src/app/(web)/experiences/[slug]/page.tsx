import { notFound } from "next/navigation"
import Link from "next/link"
import sanitizeHtml from "sanitize-html"
import { getExperienceBySlug } from "@/lib/api/experiences"
import { Container } from "@/components/web/container"
import { Badge } from "@repo/ui/components/ui/badge"

const ARTICLE_TYPE_LABELS: Record<string, string> = {
  guide: "攻略",
  interview: "面经",
  review: "点评",
}

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
  const articleTypeLabel = experience.article_type
    ? ARTICLE_TYPE_LABELS[experience.article_type as keyof typeof ARTICLE_TYPE_LABELS] ?? experience.article_type
    : null
  const metadata = [
    { label: "经验类型", value: articleTypeLabel },
    { label: "公司/团队", value: experience.organization_name },
    { label: "岗位", value: experience.job_title },
    { label: "面试地点", value: experience.publish_location },
    {
      label: "发布时间",
      value: experience.publish_time ? new Date(experience.publish_time).toLocaleDateString() : null,
    },
    {
      label: "浏览量",
      value:
        typeof experience.view_count === "number" ? `${experience.view_count.toLocaleString()} 次浏览` : null,
    },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value))

  return (
    <main className="bg-background min-h-screen py-10">
      <Container className="max-w-3xl space-y-8">
        <Link href="/experiences" className="text-sm text-primary hover:underline">
          ← 返回经验列表
        </Link>

        <article className="space-y-6">
          <header className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {articleTypeLabel && <Badge variant="outline">{articleTypeLabel}</Badge>}
              {experience.tags?.slice(0, 2).map((tag: string) => (
                <span key={tag} className="rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-wider">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">{experience.title}</h1>
              {experience.summary && (
                <p className="text-muted-foreground leading-relaxed text-base">{experience.summary}</p>
              )}
            </div>
            {metadata.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {metadata.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                    <p className="text-base font-semibold text-foreground mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
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

          <section className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                <span className="h-px w-8 bg-primary/60" />
                经验详情
              </div>
              <p className="text-muted-foreground text-sm">
                将复杂的经历拆分成多个章节阅读，帮助你逐段吸收关键信息。
              </p>
            </div>
            {sections.length > 0 ? (
              <div className="flex flex-col gap-6">
                {sections.map((section: any, index: number) => (
                  <div key={section.order ?? index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      {index < sections.length - 1 && <div className="mt-2 w-px flex-1 bg-border/60" />}
                    </div>
                    <div className="flex-1 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm space-y-4">
                      {section.title && <h2 className="text-xl font-semibold">{section.title}</h2>}
                      <div
                        className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sanitize(section.body_html) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm">
                <div
                  className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitize(experience.content_html) }}
                />
              </div>
            )}
          </section>

          <footer className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
            <p>发布地点：{experience.publish_location || "未知"}</p>
            {experience.view_count !== undefined && <p>浏览量：{experience.view_count}</p>}
          </footer>
        </article>
      </Container>
    </main>
  )
}
