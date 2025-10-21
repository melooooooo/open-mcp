import { ExperienceSection } from "@/components/career/experience-section"
import { mockExperiences } from "@/data/mock-data"
import { Container } from "@/components/web/container"
import { Button } from "@repo/ui/components/ui/button"
import Link from "next/link"

export default function ExperiencesPage() {
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
                <Link href="/referrals">查看内推机会</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <ExperienceSection experiences={mockExperiences} showViewAll={false} />

      <section className="mt-12">
        <Container className="grid gap-6 rounded-xl border bg-card p-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold mb-2">经验标签导航</h2>
            <p className="text-muted-foreground">
              常用标签已为你整理完毕，覆盖技术面、HR 面、产品、算法等岗位，快速定位目标内容。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {Array.from(new Set(mockExperiences.flatMap((item) => item.tags)))
              .slice(0, 12)
              .map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-3 py-1">
                  #{tag}
                </span>
              ))}
          </div>
        </Container>
      </section>
    </main>
  )
}
