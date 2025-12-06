import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Container } from "@/components/web/container"
import { Section } from "@/components/web/section"
import { ReferralList } from "@/components/referral/referral-list"
import { getScrapedJobCollectionStatus } from "@/app/actions/interactions"

export const metadata = {
  title: "内推广场 - 银行帮",
  description: "最新银行与互联网大厂内推机会，直达面试官。",
}

export default async function ReferralPage() {
  const supabase = await createServerSupabaseClient()

  const { data: jobs } = await supabase
    .from("scraped_jobs")
    .select("id, title, link, publish_date, reply_count, source")
    .order("publish_date", { ascending: false })
    .limit(50)

  // 获取用户收藏状态
  const jobIds = jobs?.map(j => j.id) || []
  const collectionStatus = await getScrapedJobCollectionStatus(jobIds)

  return (
    <div className="flex min-h-screen flex-col">
      <Section background="gradient" className="py-12">
        <Container>
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              内推广场
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              汇聚最新内推机会，助你快人一步拿到 Offer
            </p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <ReferralList jobs={jobs || []} collectionStatus={collectionStatus} />
        </Container>
      </Section>
    </div>
  )
}
