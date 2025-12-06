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

  // 首页同样的主推站点优先顺序，先保证优先站点排前，再按热度
  const preferredSites = [
    "BOSS直聘",
    "智联招聘",
    "拉勾招聘",
    "前程无忧",
    "猎聘",
    "牛客网招聘",
    "实习僧",
    "国聘网"
  ]
  const preferredIndex = (title: string) => {
    const idx = preferredSites.findIndex((name) => title.includes(name))
    return idx === -1 ? Infinity : idx
  }
  const sortedJobs = [...jobs].sort((a, b) => {
    const pa = preferredIndex(a.title)
    const pb = preferredIndex(b.title)
    if (pa !== pb) return pa - pb
    const va = a.viewCount || 0
    const vb = b.viewCount || 0
    if (va !== vb) return vb - va
    return a.title.localeCompare(b.title)
  })
  
  return <JobsClient jobs={sortedJobs} isFallback={isFallback} />
}
