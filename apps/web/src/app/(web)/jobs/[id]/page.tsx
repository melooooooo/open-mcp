import { JobDetailWrapper } from "@/components/career/job-detail-wrapper"

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return <JobDetailWrapper jobId={id} />
}