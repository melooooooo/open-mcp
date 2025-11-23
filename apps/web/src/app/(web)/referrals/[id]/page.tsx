import { createClient } from "@/lib/supabase/client"
import { Container } from "@/components/web/container"
import { Section } from "@/components/web/section"
import { JobContent } from "@/components/referral/job-content"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Calendar, MessageSquare, ExternalLink, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export const metadata = {
  title: "内推详情 - 银行帮",
}

export default async function ReferralDetailPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: job } = await supabase
    .from("scraped_jobs")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!job) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Section className="py-8">
        <Container>
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
              <Link href="/referrals">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回内推列表
              </Link>
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">{job.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{job.publish_date || "未知日期"}</span>
                  </div>
                  {job.reply_count !== null && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{job.reply_count} 回复</span>
                    </div>
                  )}
                  <Badge variant="secondary">
                    {job.source === 'byr_bbs' ? '北邮人论坛' : '其他来源'}
                  </Badge>
                </div>
              </div>

              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="bg-muted/30 p-6 rounded-lg border">
                  <JobContent content={job.content} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="font-semibold mb-4">原始链接</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  点击下方按钮跳转至原始发布页面查看更多详情或进行回复。
                </p>
                <Button className="w-full" asChild>
                  <Link href={job.link} target="_blank">
                    查看原文
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}
