import { JobDetailWrapper } from "@/components/career/job-detail-wrapper"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // `/jobs` 属于「导航」模块（cp_job_sites）。如果该 id 实际来自 `job_listings`（招聘列表），重定向到 `/recruitment/[id]`
  // 以确保顶部导航高亮正确（招聘）。
  const supabase = await createServerSupabaseClient()

  const { data: jobSite } = await supabase
    .from("cp_job_sites")
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (jobSite?.id) {
    return <JobDetailWrapper jobId={id} />
  }

  const { data: listing } = await supabase
    .from("job_listings")
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (listing?.id) {
    redirect(`/recruitment/${id}`)
  }

  notFound()
}
