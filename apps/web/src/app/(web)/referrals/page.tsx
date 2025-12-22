import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Container } from "@/components/web/container"
import { Section } from "@/components/web/section"
import { ReferralList } from "@/components/referral/referral-list"
import { ReferralPagination } from "@/components/referral/referral-pagination"
import { getScrapedJobCollectionStatus } from "@/app/actions/interactions"

export const metadata = {
  title: "内推广场 - 银行帮",
  description: "最新银行与互联网大厂内推机会，直达面试官。",
}

const PAGE_SIZE = 30

export default async function ReferralPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: jobs, count } = await supabase
    .from("scraped_jobs")
    .select("id, title, link, publish_date, reply_count, source", { count: "exact" })
    .order("publish_date", { ascending: false })
    .range(from, to)

  const totalCount = count || 0
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 1

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
        <Container className="space-y-6">
          <ReferralList jobs={jobs || []} collectionStatus={collectionStatus} />
          <ReferralPagination page={page} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} />
        </Container>
      </Section>
    </div>
  )
}
