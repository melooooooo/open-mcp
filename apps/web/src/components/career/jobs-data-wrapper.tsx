import { getJobs } from "@/lib/api/jobs"
import { JobsClient } from "./jobs-client"
import { mockJobs } from "@/data/mock-data"
import { normalizeJobRecord } from "@/lib/normalizers/job"

export async function JobsDataWrapper() {
  // 从数据库获取真实数据
  const allJobs = await getJobs()
  const isFallback = allJobs.length === 0
  const jobSource = (isFallback ? mockJobs : allJobs) as Parameters<typeof normalizeJobRecord>[0][]
  
  // 处理数据格式
  const jobs = jobSource.map(job => normalizeJobRecord(job))
  
  return <JobsClient jobs={jobs} isFallback={isFallback} />
}
