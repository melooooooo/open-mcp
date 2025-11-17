import { getJobs } from "@/lib/api/jobs"
import { JobSourcesClient } from "./job-sources-client"
import type { JobSource } from "./job-source-card"
import { mockJobSources } from "@/data/mock-data"

export async function JobSourcesWrapper() {
  const supabaseSites = await getJobs()
  const hasData = supabaseSites.length > 0

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

  const sources: JobSource[] = (hasData ? supabaseSites : mockJobSources).map(mapSiteToSource)

  return <JobSourcesClient sources={sources} isFallback={!hasData} />
}
