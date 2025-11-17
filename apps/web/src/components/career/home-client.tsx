"use client"

import { CareerHeroSection } from "@/components/career/hero-section"
import { JobSection } from "@/components/career/job-section"
import { ExperienceSection } from "@/components/career/experience-section"
import { CompanySection } from "@/components/career/company-section"
import { Container } from "@/components/web/container"
import { Section } from "@/components/web/section"
import { Button } from "@repo/ui/components/ui/button"
import { ChartBar, Trophy, Users as UsersIcon, Target, Sparkles } from "lucide-react"

type StatValue = {
  value: number
  isEstimate?: boolean
}

interface HomeClientProps {
  jobs: any[]
  experiences: any[]
  companies: any[]
  stats: {
    totalJobs: StatValue
    totalCompanies: StatValue
    totalUsers: StatValue
    successRate: StatValue
  }
}

export function HomeClient({ jobs, experiences, companies, stats }: HomeClientProps) {
  // 筛选热门和最新职位
  const hotJobs = jobs.filter(job => job.isHot).slice(0, 3)
  const newJobs = jobs.filter(job => job.isNew).slice(0, 3)
  
  // 获取热门公司
  const popularCompanies = companies.filter(company => company.isPopular).slice(0, 3)

  const formatCount = ({ value, isEstimate }: StatValue) => {
    if (value === undefined || value === null) return "-"
    const formatted = value.toLocaleString()
    return isEstimate ? `${formatted}+` : formatted
  }

  const formatRate = ({ value, isEstimate }: StatValue) => {
    if (value === undefined || value === null) return "-"
    const base = `${value}%`
    return isEstimate ? `≈${base}` : base
  }

  const heroStats = [
    { label: "在招职位", value: formatCount(stats.totalJobs), icon: ChartBar, color: "text-blue-600 dark:text-blue-400" },
    { label: "合作企业", value: formatCount(stats.totalCompanies), icon: UsersIcon, color: "text-green-600 dark:text-green-400" },
    { label: "活跃用户", value: formatCount(stats.totalUsers), icon: Target, color: "text-orange-600 dark:text-orange-400" },
    { label: "求职成功率", value: formatRate(stats.successRate), icon: Trophy, color: "text-purple-600 dark:text-purple-400" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <CareerHeroSection
          stats={heroStats}
          ctas={[
            {
              label: "查看全部职位",
              href: "/jobs",
              icon: UsersIcon,
              variant: "outline",
            },
            {
              label: "浏览面试经验",
              href: "/experiences",
              icon: Sparkles,
              variant: "default",
              className: "bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white hover:from-purple-700 hover:to-pink-700",
            },
          ]}
        />

        {/* Job Section */}
        <Section>
          <Container>
            <JobSection 
              hotJobs={hotJobs.length > 0 ? hotJobs : jobs.slice(0, 3)} 
              newJobs={newJobs.length > 0 ? newJobs : jobs.slice(3, 6)} 
            />
          </Container>
        </Section>

        {/* Experience Section */}
        <Section>
          <Container>
            <ExperienceSection experiences={experiences} />
          </Container>
        </Section>

        {/* Company Section */}
        <Section className="bg-muted/30">
          <Container>
            <CompanySection companies={popularCompanies.length > 0 ? popularCompanies : companies.slice(0, 3)} />
          </Container>
        </Section>

        {/* Stats Section */}
        <Section>
          <Container>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">平台数据</h2>
              <p className="text-muted-foreground">实时更新的求职数据，助你把握机会</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border rounded-lg p-6 text-center">
                <ChartBar className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">{formatCount(stats.totalJobs)}</div>
                <div className="text-sm text-muted-foreground">在招职位</div>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <UsersIcon className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">{formatCount(stats.totalUsers)}</div>
                <div className="text-sm text-muted-foreground">活跃用户</div>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <UsersIcon className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">{formatCount(stats.totalCompanies)}</div>
                <div className="text-sm text-muted-foreground">合作企业</div>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <Trophy className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">{formatRate(stats.successRate)}</div>
                <div className="text-sm text-muted-foreground">求职成功率</div>
              </div>
            </div>
          </Container>
        </Section>

        {/* CTA Section */}
        <Section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <Container>
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">开启你的职业征程</h2>
              <p className="text-lg mb-8 opacity-95">
                加入我们，获取最新职位信息和备战材料
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  立即注册
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                  了解更多
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      </main>
    </div>
  )
}
