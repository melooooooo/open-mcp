"use client"

import { Container } from "@/components/web/container"
import { Section } from "@/components/web/section"
import { JobContent } from "@/components/referral/job-content"
import { CollectButton } from "@/components/recruitment/collect-button"
import { Button } from "@repo/ui/components/ui/button"
import { Calendar, ArrowLeft, MapPin, GraduationCap, Building2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Badge } from "@repo/ui/components/ui/badge"

interface JobDetailSimpleProps {
  job: any
}

export function JobDetailSimple({ job }: JobDetailSimpleProps) {
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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50 dark:bg-background">
      <Section className="py-8">
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

            {/* Header Card */}
            <div className="bg-card rounded-xl border shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      <Building2 className="mr-1.5 h-3.5 w-3.5" />
                      {job.company.name}
                    </span>
                    {job.isNew && (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        最新发布
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {job.title}
                  </h1>
                </div>

                <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-blue-500/70" />
                    <span>{job.isNew ? '近期发布' : (job.applicationDeadline || '发布时间未知')}</span>
                  </div>

                  {job.location && job.location.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-blue-500/70" />
                      <span>{job.location.join("、")}</span>
                    </div>
                  )}

                  {job.educationRequirement && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-blue-500/70" />
                      <span>{job.educationRequirement}</span>
                    </div>
                  )}

                  {job.session && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span>{job.session}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Area */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                {isUrl ? (
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto min-w-[160px]">
                    <Link href={applyLink} target="_blank" rel="noopener noreferrer">
                      立即投递 <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : isEmail ? (
                  <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto min-w-[160px]">
                    <a href={applyLink}>
                      发送简历 <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button disabled size="lg" variant="outline" className="w-full sm:w-auto">
                    报名方式见详情
                  </Button>
                )}
                <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded">
                  {isUrl ? "点击将跳转至外部招聘网站" : isEmail ? "请通过邮件发送您的简历" : "请阅读下方详细说明进行申请"}
                </div>
              </div>
            </div>

            {/* Content Card */}
            <div className="bg-card rounded-xl border shadow-sm p-6 sm:p-8">
              {/* Tags */}
              {job.tags && job.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b">
                  {job.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="font-normal bg-muted hover:bg-muted/80">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-10">
                {job.description && (
                  <section>
                    <h3 className="flex items-center font-bold text-lg mb-4 text-foreground">
                      <span className="w-1 h-6 bg-blue-600 rounded-full mr-3" />
                      职位描述
                    </h3>
                    <div className="prose prose-gray dark:prose-invert max-w-none pl-4">
                      <JobContent content={job.description} />
                    </div>
                  </section>
                )}

                {job.requirements && (
                  <section>
                    <h3 className="flex items-center font-bold text-lg mb-4 text-foreground">
                      <span className="w-1 h-6 bg-blue-600 rounded-full mr-3" />
                      任职要求
                    </h3>
                    <div className="prose prose-gray dark:prose-invert max-w-none pl-4">
                      <JobContent content={job.requirements} />
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
