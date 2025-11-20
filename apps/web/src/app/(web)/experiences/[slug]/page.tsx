import { notFound } from "next/navigation"
import Link from "next/link"
import sanitizeHtml from "sanitize-html"
import { getExperienceBySlug } from "@/lib/api/experiences"
import { Container } from "@/components/web/container"
import { Badge } from "@repo/ui/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Separator } from "@repo/ui/components/ui/separator"
import { Calendar, MapPin, Eye, ArrowLeft, Briefcase, Building2 } from "lucide-react"
import { ShareButton } from "@/components/career/share-button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@repo/ui/components/ui/accordion"

const ARTICLE_TYPE_LABELS: Record<string, string> = {
  guide: "攻略",
  interview: "面经",
  review: "点评",
}

// Configure sanitize-html options
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "span", "strong", "em", "ul", "ol", "li", "br",
    "blockquote", "code", "pre", "h1", "h2", "h3", "h4", "h5", "h6",
    "table", "thead", "tbody", "tr", "th", "td",
    "img", "a", "hr", "figure", "figcaption", "div",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title"],
    // Removed style attributes to ensure consistent typography
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

  // Helper to check if sections have valid content
  const areSectionsValid = (sections: any[]) => {
    if (!sections || sections.length === 0) return false;
    // Check if at least one section has meaningful content (more than just a number like "01")
    return sections.some((section) => {
      if (!section.body_html) return false;
      // Simple strip tags to check text length
      const textContent = section.body_html.replace(/<[^>]*>/g, '').trim();
      return textContent.length > 5; // "01" is 2 chars, "01 " is 3. 5 is safe.
    });
  };

  const showSections = areSectionsValid(sections);
  const salary = experience.salary_highlights || {}
  const articleTypeLabel = experience.article_type
    ? ARTICLE_TYPE_LABELS[experience.article_type as keyof typeof ARTICLE_TYPE_LABELS] ?? experience.article_type
    : null

  const metadataItems = [
    experience.organization_name && {
      label: "公司/团队",
      value: experience.organization_name,
      icon: Building2,
    },
    experience.job_title && {
      label: "岗位",
      value: experience.job_title,
      icon: Briefcase,
    },
    experience.publish_location && {
      label: "地点",
      value: experience.publish_location,
      icon: MapPin,
    },
  ].filter(Boolean) as { label: string; value: string; icon: typeof Building2 }[]

  const metadataGrid = metadataItems.length > 0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
      {metadataItems.map((item) => (
        <div key={item.label} className="flex items-center gap-3 p-4 rounded-xl border bg-card/60">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <item.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
            <p className="font-semibold text-foreground">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  ) : null

  const salaryHighlights = salary.sentences && salary.sentences.length > 0 ? (
    <div className="rounded-xl border border-amber-200/50 bg-amber-50/60 dark:bg-amber-900/10 p-6 space-y-4">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <span className="text-lg">💰</span>
        <h3 className="font-semibold">薪酬亮点</h3>
      </div>
      <ul className="grid gap-2">
        {salary.sentences.slice(0, 6).map((line: string, index: number) => (
          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
            <span className="leading-relaxed">{line}</span>
          </li>
        ))}
      </ul>
    </div>
  ) : null

  return (
    <main className="bg-background min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative bg-muted/30 border-b">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
        <Container className="relative py-10 sm:py-14">
          <div className="space-y-8 max-w-4xl mx-auto">
            <Link
              href="/experiences"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回经验列表
            </Link>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                {articleTypeLabel && (
                  <Badge variant="secondary" className="text-sm px-3 py-1 font-medium">
                    {articleTypeLabel}
                  </Badge>
                )}
                {experience.tags?.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="text-xs font-medium text-muted-foreground bg-background/50 px-2.5 py-1 rounded-md border border-border/50">
                    #{tag}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                {experience.title}
              </h1>

              {experience.summary && (
                <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                  {experience.summary}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={experience.author?.avatar} />
                    <AvatarFallback>{experience.author?.name?.slice(0, 1) || "A"}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{experience.author?.name || "匿名用户"}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{experience.publish_time ? new Date(experience.publish_time).toLocaleDateString() : "近期发布"}</span>
                </div>
                {experience.view_count !== undefined && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>{experience.view_count.toLocaleString()} 阅读</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-10">
          {(metadataGrid || salaryHighlights) && (
            <div className="lg:hidden space-y-4">
              {metadataGrid && (
                <Accordion type="single" collapsible defaultValue="meta" className="rounded-xl border bg-card/60 px-4">
                  <AccordionItem value="meta" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold tracking-wide text-muted-foreground">
                      关键信息
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 pb-4">
                      {metadataGrid}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
              {salaryHighlights && (
                <Accordion type="single" collapsible className="rounded-xl border bg-card/60 px-4">
                  <AccordionItem value="salary" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold tracking-wide text-muted-foreground">
                      薪酬亮点
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 pb-4">
                      {salaryHighlights}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          )}

          {/* Content Sections */}
          <div className="space-y-10">
            {sections.length > 0 && showSections ? (
              <div className="space-y-16">
                {sections.map((section: any, index: number) => {
                  // Skip sections with empty body_html
                  const sanitizedContent = sanitize(section.body_html)
                  if (!sanitizedContent || sanitizedContent.trim() === '') {
                    return null
                  }

                  return (
                    <div key={section.order ?? index} className="relative pl-8 sm:pl-12 border-l-2 border-border/40 pb-10 last:pb-0 last:border-l-0">
                      <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-primary bg-background ring-4 ring-background" />
                      <div className="space-y-6">
                        {section.title && (
                          <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            {section.title}
                          </h2>
                        )}
                        <div
                          className="prose prose-lg prose-neutral dark:prose-invert max-w-none prose-p:leading-loose prose-p:text-muted-foreground prose-p:my-6 prose-headings:font-semibold prose-a:text-primary hover:prose-a:underline prose-li:leading-loose break-words whitespace-pre-line"
                          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border bg-card p-8 sm:p-12 shadow-sm">
                <div
                  className="prose prose-lg prose-neutral dark:prose-invert max-w-none prose-p:leading-loose prose-p:text-muted-foreground prose-p:my-6 prose-headings:font-bold prose-a:text-primary hover:prose-a:underline prose-img:rounded-xl prose-li:leading-loose break-words whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: sanitize(experience.content_html) }}
                />
              </div>
            )}
          </div>

          {/* Tags Footer */}
          {experience.tags?.length > 0 && (
            <div className="pt-8 border-t">
              <div className="flex flex-wrap gap-2">
                {experience.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-sm py-1 px-3 hover:bg-secondary/80 transition-colors">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block lg:col-span-4 space-y-8">
          <div className="sticky top-24 space-y-6">
            {/* Share Card */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <h3 className="font-semibold">觉得有帮助？</h3>
              <p className="text-sm text-muted-foreground">
                分享给更多正在准备面试的朋友，帮助他们少走弯路。
              </p>
              <ShareButton title={experience.title} />
            </div>

            {metadataGrid && (
              <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                <div className="text-sm text-muted-foreground uppercase tracking-wider">关键信息</div>
                {metadataGrid}
              </div>
            )}

            {salaryHighlights && (
              <div className="space-y-4">
                {salaryHighlights}
              </div>
            )}

            {/* Table of Contents (Simplified) */}
            {sections.length > 0 && showSections && (
              <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">目录</h3>
                <nav className="flex flex-col gap-2">
                  {sections.map((section: any, index: number) => section.title && (
                    <a
                      key={index}
                      href="#"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {index + 1}. {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </aside>
      </Container>
    </main>
  )
}
