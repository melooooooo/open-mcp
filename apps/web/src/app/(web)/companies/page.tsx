import { CompanySection } from "@/components/career/company-section"
import { mockCompanies } from "@/data/mock-data"
import { Container } from "@/components/web/container"
import { Button } from "@repo/ui/components/ui/button"
import Link from "next/link"
import { Building2 } from "lucide-react"

export default function CompaniesPage() {
  return (
    <main className="bg-background pb-16">
      <section className="border-b bg-muted/20">
        <Container className="py-12 sm:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2 text-blue-600">
                <Building2 className="h-5 w-5" />
                <span className="text-sm uppercase tracking-widest">Company Insights</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">企业库</h1>
              <p className="text-muted-foreground text-lg">
                了解目标公司的招聘节奏、福利待遇与发展机会。我们持续收集校招反馈与员工评分，为你的投递决策提供参考。
              </p>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/jobs">查看相关职位</Link>
            </Button>
          </div>
        </Container>
      </section>

      <CompanySection companies={mockCompanies} showViewAll={false} />

      <section className="mt-12">
        <Container className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold">企业对比</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              即将上线：支持自选公司进行薪酬、成长性、工作强度等维度对比，帮助你快速取舍 offer。
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold">校友口碑</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              聚合职启航校友的真实评价，涵盖导师带教、团队氛围、晋升路径等关键信息。
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold">岗位提醒</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              订阅感兴趣公司的校招岗位，当开放投递或更新职位时，将第一时间通过站内信和邮件通知你。
            </p>
          </div>
        </Container>
      </section>
    </main>
  )
}
