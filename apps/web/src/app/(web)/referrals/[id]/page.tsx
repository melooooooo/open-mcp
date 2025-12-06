import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Container } from "@/components/web/container"
import { Section } from "@/components/web/section"
import { JobContent } from "@/components/referral/job-content"
import { CollectButton } from "@/components/referral/collect-button"
import { Button } from "@repo/ui/components/ui/button"
import { Calendar, MessageSquare, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getScrapedJobCollectionStatus } from "@/app/actions/interactions"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata = {
  title: "内推详情 - 银行帮",
}

export default async function ReferralDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: job } = await supabase
    .from("scraped_jobs")
    .select("*")
    .eq("id", id)
    .single()

  if (!job) {
    notFound()
  }

  // 获取收藏状态
  const collectionStatus = await getScrapedJobCollectionStatus([job.id])
  const isCollected = collectionStatus[job.id] || false

  return (
    <div className="flex min-h-screen flex-col">
      <Section className="py-8">
        <Container>
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <Link href="/referrals">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回内推列表
              </Link>
            </Button>
            <CollectButton jobId={job.id} initialCollected={isCollected} />
          </div>

          <div className="grid gap-8 lg:grid-cols-1">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">{job.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>{job.publish_date || "未知日期"}</span>
                  </div>
                  {job.reply_count !== null && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span>{job.reply_count} 回复</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="bg-muted/30 p-6 rounded-lg border">
                  <JobContent content={job.content} />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}
