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
  searchParams: Promise<Record<string, string | string[] | undefined>>
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
    <main className="bg-background pb-16">
      <section className="border-b bg-muted/20">
        <Container className="py-12 sm:py-16">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-widest text-primary">Interview Stories</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">面经与攻略库</h1>
            <p className="text-muted-foreground text-lg">
              汇总各行业学长学姐的真实面试经历、备考策略与求职心法。按公司、岗位和难度快速筛选，帮助你制定高效备战计划。
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/experiences/share">分享我的经验</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/jobs">查看职位合集</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>



      {/* 全部经验列表 */}
      <section className="mt-12">
        <Container>
          <div className="rounded-2xl border bg-card/60 backdrop-blur-sm shadow-sm p-6 space-y-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-primary">Filters</p>
              <h2 className="text-2xl font-semibold">筛选条件</h2>
              <p className="text-muted-foreground text-sm">
                可按标签关键词、行业与内容类型组合筛选，高效定位你关注的经验内容。
              </p>
            </div>
            <form className="grid gap-4 md:grid-cols-4">
            <input type="hidden" name="page" value="1" />
            <div className="flex flex-col gap-2">
              <label htmlFor="tag" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                标签关键词
              </label>
              <input
                id="tag"
                name="tag"
                placeholder="如：薪资待遇"
                defaultValue={tagFilter}
                className="rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="industry" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                行业
              </label>
              <select
                id="industry"
                name="industry"
                defaultValue={industryFilter}
                className="rounded-md border px-3 py-2 text-sm bg-background"
              >
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="type" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                内容类型
              </label>
              <select
                id="type"
                name="type"
                defaultValue={typeFilter}
                className="rounded-md border px-3 py-2 text-sm bg-background"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3 md:col-span-1">
              <Button type="submit" className="w-full">
                应用筛选
              </Button>
              <Button variant="outline" asChild>
                <Link href="/experiences">重置</Link>
              </Button>
            </div>
          </form>
        </div>
        </Container>
      </section>

      <section className="mt-12">
        <Container className="space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Featured</p>
            <h2 className="text-3xl font-bold tracking-tight">全部经验分享</h2>
            <p className="text-muted-foreground">
              根据你的筛选条件，以下是符合条件的经验列表。点击卡片即可查看详情内容与薪酬数据。
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/40 via-card to-card/80 divide-y shadow-sm overflow-hidden">
            {experiences.map((exp) => (
              <Link
                key={exp.id}
                href={`/experiences/${exp.slug}`}
                className="block transition-all duration-200 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
              >
                <ExperienceCard
                  experience={exp}
                  variant="list"
                  className="rounded-none shadow-none border-0 px-6"
                />
              </Link>
            ))}
          </div>
          {experiences.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 py-16 text-center shadow-inner">
              <p className="text-lg font-semibold text-muted-foreground">暂无匹配结果</p>
              <p className="text-sm text-muted-foreground/80 mt-2">尝试修改筛选条件或清空筛选。</p>
            </div>
          )}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-widest text-muted-foreground/80">
              第 {currentPage}/{totalPages} 页 · 共 {total} 条
            </span>
            <div className="flex gap-3">
              <Button variant="outline" disabled={!hasPrev} className="min-w-[120px]" asChild>
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
              <Button variant="outline" disabled={!hasNext} className="min-w-[120px]" asChild>
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
        </Container>
      </section>

      <section className="mt-12">
        <Container>
          <div className="rounded-2xl border bg-card/70 p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold mb-1">经验标签导航</h2>
              <p className="text-muted-foreground">
                常用标签已为你整理完毕，覆盖技术面、HR 面、产品、算法等岗位，快速定位目标内容。
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
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
                  className="rounded-full border border-border px-4 py-1.5 bg-background/60 hover:bg-background text-foreground transition-colors"
                >
                  #{tag}
                </Link>
              ))}
              {selectedTags.length === 0 && (
                <span className="text-muted-foreground text-sm">暂无标签</span>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}
