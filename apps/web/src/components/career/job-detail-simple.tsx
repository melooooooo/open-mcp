"use client"

import type { ReactNode } from "react"
import { Container } from "@/components/web/container"
import { Section } from "@/components/web/section"
import { JobContent } from "@/components/referral/job-content"
import { CollectButton } from "@/components/recruitment/collect-button"
import { Button } from "@repo/ui/components/ui/button"
import { ArrowLeft, MapPin, GraduationCap, ExternalLink, Briefcase, Clock, Building2, Tags, DollarSign } from "lucide-react"
import Link from "next/link"

interface JobDetailSimpleProps {
  job: any
}

export function JobDetailSimple({ job }: JobDetailSimpleProps) {
  const titleItems = splitSemicolonList(job.title)
  const roleCount = titleItems.length

  // Determine if application method is URL or Email
  const isUrl = job.applicationMethod?.startsWith("http") || job.applicationMethod?.startsWith("www")
  const isEmail = job.applicationMethod?.includes("@")

  let applyLink = "#"
  if (isUrl) {
    applyLink = job.applicationMethod.startsWith("http") ? job.applicationMethod : `https://${job.applicationMethod}`
  } else if (isEmail) {
    const emailMatch = job.applicationMethod.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)
    if (emailMatch) {
      applyLink = `mailto:${emailMatch[0]}`
    }
  }

  const publishDate = formatDate(job.publishDate)
  const deadlineDate = formatDate(job.applicationDeadline)
  const timeText =
    publishDate && deadlineDate
      ? `更新于 ${publishDate} · 截止 ${deadlineDate}`
      : publishDate
        ? `更新于 ${publishDate}`
        : deadlineDate
          ? `截止 ${deadlineDate}`
          : "时间未知"
  const salaryText = formatSalary(job.salaryMin, job.salaryMax)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50/80 via-gray-50/40 to-background dark:from-background dark:via-background dark:to-background">
      <Section className="py-10">
        <Container>
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild className="-ml-2 hover:bg-white/80 transition-colors">
                <Link href="/recruitment">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回招聘列表
                </Link>
              </Button>
              <CollectButton jobId={job.id} initialCollected={false} />
            </div>

            {/* Header / Summary */}
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <div className="inline-flex items-center gap-2">
                      {job.company.logo ? (
                        <img
                          src={job.company.logo}
                          alt={job.company.name}
                          className="h-8 w-8 rounded-md object-contain bg-white border"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-blue-700/80" />
                      )}
                      <span className="text-lg sm:text-xl font-semibold text-foreground break-words">
                        {job.company.name}
                      </span>
                    </div>
                    {job.isNew && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-200">
                        新发布
                      </span>
                    )}
                  </div>

                  <div className="rounded-2xl border bg-muted/10 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
                      {salaryText !== "薪资面议" && (
                        <div className="flex items-start gap-2 min-w-[100px]">
                          <div className="mt-0.5 text-red-600"><DollarSign className="h-4 w-4" /></div>
                          <div className="space-y-0.5">
                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">薪资</div>
                            <div className="text-sm font-bold text-red-600 break-words leading-relaxed">{salaryText}</div>
                          </div>
                        </div>
                      )}
                      <MetaItem icon={<Clock className="h-4 w-4" />} label="时间" value={timeText} />
                      {job.location && job.location.length > 0 && (
                        <MetaItem icon={<MapPin className="h-4 w-4" />} label="地点" value={job.location.join("、")} />
                      )}
                      {job.tags && job.tags.length > 0 && (
                        <MetaItem icon={<Tags className="h-4 w-4" />} label="标签" value={job.tags.join(" · ")} />
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-700 ring-1 ring-inset ring-blue-600/10">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground break-words leading-tight">
                        {roleCount > 1 ? "招聘岗位" : job.title}
                      </h1>
                      {roleCount > 1 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          共 <span className="font-semibold text-foreground/90">{roleCount}</span> 个岗位
                        </div>
                      )}
                    </div>
                  </div>

                  {roleCount > 1 && (
                    <div className="pt-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-foreground">岗位列表</div>
                      </div>
                      <ul className="mt-4 space-y-3">
                        {titleItems.map((item, idx) => (
                          <RoleLine key={idx} index={idx + 1} text={item} />
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-6 border-t">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {isUrl ? "点击将跳转至外部招聘网站" : isEmail ? "将通过邮件发送简历（请留意主题与附件命名）" : "请阅读下方详细说明进行申请"}
                      </div>
                      <div className="shrink-0">
                        {isUrl ? (
                          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto">
                            <Link href={applyLink} target="_blank" rel="noopener noreferrer">
                              立即投递 <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        ) : isEmail ? (
                          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                            <a href={applyLink}>
                              发送简历 <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                          <Button disabled size="lg" variant="outline" className="w-full sm:w-auto">
                            报名方式见详情
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail List */}
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="divide-y">
                {job.description && (
                  <section className="p-6 sm:p-8">
                    <h3 className="flex items-center gap-2 font-bold text-lg text-foreground">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      职位描述
                    </h3>
                    <div className="mt-4">
                      <JobContent content={job.description} />
                    </div>
                  </section>
                )}

                {job.requirements && (
                  <section className="p-6 sm:p-8">
                    <h3 className="flex items-center gap-2 font-bold text-lg text-foreground">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      任职要求
                    </h3>
                    <div className="mt-4">
                      <JobContent content={job.requirements} />
                    </div>
                  </section>
                )}

                {job.applicationMethod && (
                  <section className="p-6 sm:p-8">
                    <h3 className="flex items-center gap-2 font-bold text-lg text-foreground">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      投递方式
                    </h3>
                    <div className="mt-4 rounded-xl border bg-muted/10 px-4 py-3 text-sm sm:text-base">
                      <div className="flex flex-col gap-2">
                        <div className="min-w-0">
                          <div className="text-muted-foreground text-xs sm:text-sm">投递信息</div>
                          <div className="mt-1 font-semibold text-foreground break-words">
                            {isEmail ? (
                              <a className="hover:underline" href={applyLink}>
                                {job.applicationMethod}
                              </a>
                            ) : (
                              job.applicationMethod
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}

function splitSemicolonList(value?: string | null) {
  if (!value || typeof value !== "string") return []
  const parts = value
    .split(/[；;]\s*/g)
    .map((s) => s.trim())
    .filter(Boolean)

  return parts.length > 1 ? parts : []
}

function formatDate(value?: string | Date | null) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toISOString().slice(0, 10)
}

function formatSalary(min?: number, max?: number) {
  if (!min && !max) return "薪资面议"
  if (min && !max) return `${min}k 起`
  if (!min && max) return `${max}k`
  if (min === max) return `${min}k`
  return `${min}-${max}k`
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2 min-w-[160px]">
      <div className="mt-0.5 text-blue-600/80">{icon}</div>
      <div className="space-y-0.5">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold text-foreground/90 break-words leading-relaxed">{value}</div>
      </div>
    </div>
  )
}

function RoleLine({ index, text }: { index: number; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md border border-muted-foreground/20 px-1 text-[11px] font-medium text-muted-foreground">
        {index}.
      </span>
      <span className="min-w-0 text-sm sm:text-base leading-relaxed text-foreground/90 break-words">
        {text}
      </span>
    </li>
  )
}
