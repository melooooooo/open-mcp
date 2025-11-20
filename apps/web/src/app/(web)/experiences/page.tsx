import Link from "next/link"
import { getExperiencesList } from "@/lib/api/experiences"
import { Container } from "@/components/web/container"
import { Button } from "@repo/ui/components/ui/button"
import { ExperienceCard } from "@/components/career/experience-card"

const INDUSTRY_OPTIONS = [
  { label: "全部行业", value: "" },
  { label: "银行", value: "bank" },
  { label: "券商", value: "securities" },
  { label: "保险", value: "insurance" },
  { label: "运营商", value: "operator" },
  { label: "科技/研发", value: "technology" },
  { label: "其他行业", value: "other" },
]

const TYPE_OPTIONS = [
  { label: "全部类型", value: "" },
  { label: "攻略", value: "guide" },
  { label: "面经", value: "interview" },
  { label: "点评", value: "review" },
]

const PAGE_SIZE = 12

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value ?? ""
}

function buildQueryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === "" || value === null) return
    params.set(key, String(value))
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

type SearchParams = Record<string, string | string[] | undefined>

type ExperiencesPageProps = {
  searchParams: SearchParams | Promise<SearchParams>
}

export default async function ExperiencesPage({ searchParams }: ExperiencesPageProps) {
  const resolvedParams = await searchParams

  const currentPage = Math.max(parseInt(getParamValue(resolvedParams.page) || "1", 10), 1)
  const tagFilter = getParamValue(resolvedParams.tag)
  const industryFilter = getParamValue(resolvedParams.industry)
  const typeFilter = getParamValue(resolvedParams.type)

  const { items: experiences, total } = await getExperiencesList({
    limit: PAGE_SIZE,
    page: currentPage,
    tag: tagFilter || undefined,
    industry: industryFilter || undefined,
    type: typeFilter || undefined,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages
  const selectedTags = Array.from(new Set(experiences.flatMap((item) => item.tags || [])))

  return (
    <main className="bg-background min-h-screen pb-20">
      {/* Header Section */}
      <section className="relative border-b bg-muted/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
        <Container className="relative py-12 sm:py-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="max-w-2xl space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Interview Stories
                </span>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
                  面经与攻略库
                </h1>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
                汇总各行业学长学姐的真实面试经历、备考策略与求职心法。按公司、岗位和难度快速筛选，让准备更有方向。
              </p>

              <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground pt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border/50 backdrop-blur-sm">
                  <span className="text-lg font-bold text-foreground">{total}</span>
                  <span>真实经验</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border/50 backdrop-blur-sm">
                  <span className="text-lg font-bold text-foreground">{selectedTags.length}</span>
                  <span>热门标签</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border/50 backdrop-blur-sm">
                  <span className="text-lg font-bold text-foreground">{INDUSTRY_OPTIONS.length - 1}</span>
                  <span>覆盖行业</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button asChild size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                <Link href="/experiences/share">分享我的经验</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="bg-background/50 backdrop-blur-sm">
                <Link href="/jobs">查看职位合集</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Container className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="h-4 w-1 bg-primary rounded-full" />
                <h2 className="font-semibold">筛选条件</h2>
              </div>

              <form className="space-y-5" method="get" action="/experiences">
                <input type="hidden" name="page" value="1" />

                <div className="space-y-2">
                  <label htmlFor="tag" className="text-sm font-medium text-muted-foreground">
                    标签关键词
                  </label>
                  <input
                    id="tag"
                    name="tag"
                    placeholder="如：薪资待遇"
                    defaultValue={tagFilter}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="industry" className="text-sm font-medium text-muted-foreground">
                    行业分类
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    defaultValue={industryFilter}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {INDUSTRY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium text-muted-foreground">
                    内容类型
                  </label>
                  <select
                    id="type"
                    name="type"
                    defaultValue={typeFilter}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 space-y-2">
                  <Button type="submit" className="w-full">
                    应用筛选
                  </Button>
                  {(tagFilter || industryFilter || typeFilter) && (
                    <Button variant="ghost" asChild className="w-full text-muted-foreground hover:text-foreground">
                      <Link href="/experiences">重置所有条件</Link>
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Popular Tags Sidebar */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">热门标签</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTags.slice(0, 15).map((tag) => (
                  <Link
                    key={tag}
                    href={
                      "/experiences" +
                      buildQueryString({
                        tag,
                        industry: industryFilter || undefined,
                        type: typeFilter || undefined,
                        page: 1,
                      })
                    }
                    className="text-xs px-2.5 py-1 rounded-md bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Mobile Filters */}
          <div className="lg:hidden rounded-xl border bg-card p-4 shadow-sm">
            <form className="grid gap-4 sm:grid-cols-3" method="get" action="/experiences">
              <input type="hidden" name="page" value="1" />
              <input
                name="tag"
                placeholder="搜索标签..."
                defaultValue={tagFilter}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <select
                name="industry"
                defaultValue={industryFilter}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">筛选</Button>
                {(tagFilter || industryFilter || typeFilter) && (
                  <Button variant="outline" asChild className="px-3">
                    <Link href="/experiences">重置</Link>
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Active Filters Display */}
          {(tagFilter || industryFilter || typeFilter) && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">当前筛选:</span>
              {industryFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  行业: {INDUSTRY_OPTIONS.find(opt => opt.value === industryFilter)?.label}
                </span>
              )}
              {typeFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  类型: {TYPE_OPTIONS.find(opt => opt.value === typeFilter)?.label}
                </span>
              )}
              {tagFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  标签: {tagFilter}
                </span>
              )}
            </div>
          )}

          {/* List */}
          {experiences.length > 0 ? (
            <div className="space-y-4">
              {experiences.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.slug}`}
                  className="block"
                >
                  <ExperienceCard
                    experience={exp}
                    variant="list"
                    className="bg-card hover:bg-card/80 border-border/60 shadow-sm hover:shadow-md"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 py-20 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/50">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">暂无匹配结果</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  我们找不到符合您当前筛选条件的经验分享。尝试调整筛选条件或查看所有内容。
                </p>
                <Button variant="outline" asChild className="mt-4">
                  <Link href="/experiences">查看所有经验</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {experiences.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t">
              <div className="text-sm text-muted-foreground">
                显示第 <span className="font-medium text-foreground">{currentPage}</span> 页，
                共 <span className="font-medium text-foreground">{totalPages}</span> 页
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPrev}
                  asChild={hasPrev}
                >
                  {hasPrev ? (
                    <Link
                      href={
                        "/experiences" +
                        buildQueryString({
                          tag: tagFilter || undefined,
                          industry: industryFilter || undefined,
                          type: typeFilter || undefined,
                          page: currentPage - 1,
                        })
                      }
                    >
                      上一页
                    </Link>
                  ) : (
                    <span>上一页</span>
                  )}
                </Button>

                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      p = currentPage - 2 + i;
                      if (p > totalPages) p = totalPages - (4 - i);
                    }

                    return (
                      <Button
                        key={p}
                        variant={p === currentPage ? "default" : "ghost"}
                        size="sm"
                        className={p === currentPage ? "pointer-events-none" : ""}
                        asChild
                      >
                        <Link
                          href={
                            "/experiences" +
                            buildQueryString({
                              tag: tagFilter || undefined,
                              industry: industryFilter || undefined,
                              type: typeFilter || undefined,
                              page: p,
                            })
                          }
                        >
                          {p}
                        </Link>
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNext}
                  asChild={hasNext}
                >
                  {hasNext ? (
                    <Link
                      href={
                        "/experiences" +
                        buildQueryString({
                          tag: tagFilter || undefined,
                          industry: industryFilter || undefined,
                          type: typeFilter || undefined,
                          page: currentPage + 1,
                        })
                      }
                    >
                      下一页
                    </Link>
                  ) : (
                    <span>下一页</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </main>
  )
}
