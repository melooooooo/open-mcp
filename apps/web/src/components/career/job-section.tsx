"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Flame, Sparkles, Building2 } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { JobCard } from "./job-card"
import { Badge } from "@repo/ui/components/ui/badge"

interface JobSectionProps {
  hotJobs: any[]
  newJobs: any[]
  referralJobs?: any[]
}

export function JobSection({ hotJobs, newJobs, referralJobs = [] }: JobSectionProps) {
  const router = useRouter()
  const hasJobs = hotJobs.length > 0 || newJobs.length > 0 || referralJobs.length > 0

  return (
    <section className="py-12">
      <div className="container space-y-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider text-muted-foreground">Job Highlights</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">精选职位</h2>
            <p className="mt-2 text-muted-foreground">
              根据平台热度和最新上架同步更新，帮你快速锁定热门与新鲜机会。
            </p>
          </div>
          <Button variant="outline" className="self-start md:self-center" asChild>
            <Link href="/jobs">
              浏览全部职位
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {hasJobs ? (
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <h3 className="text-xl font-semibold">热门职位</h3>
                </div>
                <Badge variant="secondary">高关注度</Badge>
              </div>
              <div className="space-y-4">
                {hotJobs.length > 0 ? (
                  hotJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      variant="compact"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    />
                  ))
                ) : (
                  <div className="rounded-lg border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    当前暂无热门岗位，尝试查看最新职位或调整筛选条件。
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <h3 className="text-xl font-semibold">最新上架</h3>
                </div>
                <Badge variant="secondary">刚刚更新</Badge>
              </div>
              <div className="space-y-4">
                {newJobs.length > 0 ? (
                  newJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      variant="compact"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    />
                  ))
                ) : (
                  <div className="rounded-lg border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    新职位正在路上，请稍后再来或关注热门岗位。
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-10 text-center">
            <div className="text-5xl mb-4">🧭</div>
            <h3 className="text-xl font-semibold mb-2">暂时没有可展示的职位</h3>
            <p className="text-muted-foreground mb-6">尝试前往职位广场查看更多岗位，或订阅职位提醒第一时间掌握开放信息。</p>
            <Button size="lg" asChild>
              <Link href="/jobs">
                去职位广场看看
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {referralJobs.length > 0 && (
          <div className="rounded-xl border bg-muted/40 p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-500" />
                <h3 className="text-lg font-semibold">开放内推的岗位</h3>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/referrals">
                  查看全部内推
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {referralJobs.map((job) => (
                <JobCard
                  key={`${job.id}-referral`}
                  job={{ ...job, hasReferral: true }}
                  variant="compact"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
