import { getJobs } from "@/lib/api/jobs"
import { JobSourcesClient } from "./job-sources-client"
import type { JobSource } from "./job-source-card"
import { mockJobSources } from "@/data/mock-data"

export async function JobSourcesWrapper() {
  const supabaseSites = await getJobs()
  const hasData = supabaseSites.length > 0

  // 与首页保持一致的优先展示顺序
  const preferredSites = [
    "BOSS直聘",
    "智联招聘",
    "拉勾招聘",
    "前程无忧",
    "猎聘",
    "牛客网招聘",
    "实习僧",
    "国聘网",
  ]
  const preferredIndex = (title: string) => {
    const idx = preferredSites.findIndex((name) => title?.includes(name))
    return idx === -1 ? Infinity : idx
  }

  const mapSiteToSource = (site: any): JobSource => ({
    id: site.id,
    name: site.title ?? site.name ?? "未知来源",
    logo: site.company_logo ?? site.logo,
    description: site.description ?? site.department ?? "",
    url: site.website_url ?? site.url ?? "#",
    tags: Array.isArray(site.tags) ? site.tags : site.tags ?? [],
    updatesToday: site.view_count ?? site.updatesToday,
    totalItems: site.application_count ?? site.totalItems,
  })

  const sources: JobSource[] = (hasData ? supabaseSites : mockJobSources)
    .map(mapSiteToSource)
    .sort((a, b) => {
      const pa = preferredIndex(a.name)
      const pb = preferredIndex(b.name)
      if (pa !== pb) return pa - pb
      const va = a.updatesToday ?? a.totalItems ?? 0
      const vb = b.updatesToday ?? b.totalItems ?? 0
      if (va !== vb) return vb - va
      return (a.name ?? "").localeCompare(b.name ?? "")
    })

  return <JobSourcesClient sources={sources} isFallback={!hasData} />
}
