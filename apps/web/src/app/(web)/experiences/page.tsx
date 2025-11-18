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

type ExperiencesPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function ExperiencesPage({ searchParams }: ExperiencesPageProps) {
  const currentPage = Math.max(parseInt(getParamValue(searchParams.page) || "1", 10), 1)
  const tagFilter = getParamValue(searchParams.tag)
  const industryFilter = getParamValue(searchParams.industry)
  const typeFilter = getParamValue(searchParams.type)

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
    <main className="bg-background pb-16">
      <section className="border-b bg-muted/40">
        <Container className="py-12 sm:py-16">
          <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] items-center">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Interview Stories
              </span>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">面经与攻略库</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                汇总各行业学长学姐的真实面试经历、备考策略与求职心法。按公司、岗位和难度快速筛选，让准备更有方向。
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="shadow-sm">
                  <Link href="/experiences/share">分享我的经验</Link>
                </Button>
                <Button variant="outline" asChild className="shadow-sm">
                  <Link href="/jobs">查看职位合集</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">精选亮点</p>
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                    <p className="text-lg font-semibold text-foreground">{total}</p>
                    <p>真实经验分享</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                    <p className="text-lg font-semibold text-foreground">{selectedTags.length}</p>
                    <p>热门标签</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                    <p className="text-lg font-semibold text-foreground">{INDUSTRY_OPTIONS.length - 1}</p>
                    <p>覆盖行业</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                    <p className="text-lg font-semibold text-foreground">{TYPE_OPTIONS.length - 1}</p>
                    <p>内容类型</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>



      {/* 筛选区域 */}
      <section className="mt-12">
        <Container>
          <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm shadow-sm p-8 space-y-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-10 bg-primary rounded-full" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Filters</p>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">筛选条件</h2>
              <p className="text-muted-foreground text-base max-w-2xl">
                按标签、行业与内容类型组合筛选，快速定位你关注的经验内容。
              </p>
            </div>
            <form className="grid gap-6 md:grid-cols-4" method="get" action="/experiences">
              <input type="hidden" name="page" value="1" />
              <div className="flex flex-col gap-3">
                <label htmlFor="tag" className="text-sm font-semibold text-foreground">
                  标签关键词
                </label>
                <input
                  id="tag"
                  name="tag"
                  placeholder="如：薪资待遇"
                  defaultValue={tagFilter}
                  className="rounded-lg border border-border px-4 py-3 text-sm bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label htmlFor="industry" className="text-sm font-semibold text-foreground">
                  行业
                </label>
                <select
                  id="industry"
                  name="industry"
                  defaultValue={industryFilter}
                  className="rounded-lg border border-border px-4 py-3 text-sm bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  {INDUSTRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-3">
                <label htmlFor="type" className="text-sm font-semibold text-foreground">
                  内容类型
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={typeFilter}
                  className="rounded-lg border border-border px-4 py-3 text-sm bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-3 md:col-span-1">
                <Button type="submit" className="flex-1 h-12 text-base font-semibold shadow-sm">
                  应用筛选
                </Button>
                <Button variant="outline" asChild className="h-12 px-6">
                  <Link href="/experiences">重置</Link>
                </Button>
              </div>
            </form>
          </div>
        </Container>
      </section>

      {/* 经验列表 */}
      <section className="mt-16">
        <Container className="space-y-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-1 w-10 bg-primary rounded-full" />
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Featured</p>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">全部经验分享</h2>
            <p className="text-muted-foreground text-lg max-w-3xl">
              根据筛选条件展示的经验列表。点击卡片查看详情与薪酬数据。
            </p>
            {(tagFilter || industryFilter || typeFilter) && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">当前筛选:</span>
                {industryFilter && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                    {INDUSTRY_OPTIONS.find(opt => opt.value === industryFilter)?.label}
                  </span>
                )}
                {typeFilter && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                    {TYPE_OPTIONS.find(opt => opt.value === typeFilter)?.label}
                  </span>
                )}
                {tagFilter && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                    #{tagFilter}
                  </span>
                )}
              </div>
            )}
          </div>

          {experiences.length > 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card/80 divide-y divide-border/60 shadow-md overflow-hidden backdrop-blur-sm">
              {experiences.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.slug}`}
                  className="block transition-all duration-200 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                >
                  <ExperienceCard
                    experience={exp}
                    variant="list"
                    className="rounded-none shadow-none border-0 px-8 py-6"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/40 py-16 text-center shadow-inner">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full border border-border/70 flex items-center justify-center text-muted-foreground font-semibold">
                  No Data
                </div>
                <p className="text-xl font-semibold text-foreground">暂无匹配结果</p>
                <p className="text-base text-muted-foreground/80 max-w-md">
                  尝试修改筛选条件或清空筛选，探索更多内容。
                </p>
                <Button variant="outline" asChild className="mt-2">
                  <Link href="/experiences">清空筛选</Link>
                </Button>
              </div>
            </div>
          )}

          {/* 分页 */}
          {experiences.length > 0 && (
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {currentPage}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    第 {currentPage} / {totalPages} 页
                  </span>
                  <span className="text-xs text-muted-foreground">
                    共 {total} 条经验分享
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  disabled={!hasPrev}
                  className="min-w-[140px] h-11 text-base font-semibold border-2 hover:bg-primary hover:text-primary-foreground transition-all"
                  asChild
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
                <Button
                  variant="outline"
                  disabled={!hasNext}
                  className="min-w-[140px] h-11 text-base font-semibold border-2 hover:bg-primary hover:text-primary-foreground transition-all"
                  asChild
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
        </Container>
      </section>

      {/* 标签导航 */}
      <section className="mt-16 mb-12">
        <Container>
          <div className="rounded-2xl border border-primary/10 bg-card/80 p-8 space-y-6 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-10 bg-primary rounded-full"></div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Tags</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">经验标签导航</h2>
              <p className="text-muted-foreground text-base max-w-2xl">覆盖技术面、HR 面、产品、算法等岗位的常用标签。</p>
            </div>
            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {selectedTags.slice(0, 12).map((tag) => (
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
                    className="group inline-flex items-center gap-2 rounded-full border border-primary/20 px-4 py-2 bg-background/80 hover:bg-primary hover:text-primary-foreground hover:border-primary text-foreground transition-all duration-200 shadow-sm font-medium"
                  >
                    <span className="text-sm">#{tag}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="h-10 w-10 rounded-full border border-border/70 flex items-center justify-center text-muted-foreground text-sm font-semibold">
                  -
                </div>
                <span className="text-muted-foreground text-base">当前筛选条件下暂无标签</span>
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  )
}
