export interface NormalizedJob {
  id: string
  title: string
  company: {
    name: string
    logo?: string
    size?: string
  }
  department?: string
  location: string[]
  salaryMin?: number
  salaryMax?: number
  jobType: "fulltime" | "intern" | "parttime"
  educationRequirement?: string
  tags: string[]
  applicationDeadline?: string
  viewCount?: number
  applicationCount?: number
  isHot?: boolean
  isNew?: boolean
  hasReferral?: boolean
}

type SupabaseJob = {
  id: string
  title: string
  department?: string | null
  job_type?: NormalizedJob["jobType"] | null
  jobType?: NormalizedJob["jobType"] | null
  salary_min?: number | null
  salaryMax?: number | null
  salary_max?: number | null
  education_requirement?: string | null
  application_deadline?: string | null
  applicationDeadline?: string | null
  created_at?: string | null
  createdAt?: string | null
  view_count?: number | null
  viewCount?: number | null
  application_count?: number | null
  applicationCount?: number | null
  has_referral?: boolean | null
  hasReferral?: boolean | null
  locations?: string[] | null
  location?: string[] | string | null
  tags?: string[] | null
  companies?: {
    name?: string | null
    logo_url?: string | null
    size?: string | null
  } | null
}

type MockJob = NormalizedJob

function normalizeLocations(rawLocation: unknown): string[] {
  if (Array.isArray(rawLocation)) {
    return rawLocation.filter((item): item is string => typeof item === "string")
  }

  if (typeof rawLocation === "string" && rawLocation.length > 0) {
    return [rawLocation]
  }

  return []
}

export function normalizeJobRecord(job: SupabaseJob | MockJob): NormalizedJob {
  const isMock = "company" in job && !!job.company

  const company = isMock
    ? job.company
    : {
        name: job.companies?.name || "未知公司",
        logo: job.companies?.logo_url || undefined,
        size: job.companies?.size || undefined,
      }

  const salaryMin = isMock ? job.salaryMin : job.salary_min ?? job.salaryMin
  const salaryMax = isMock ? job.salaryMax : job.salary_max ?? job.salaryMax
  const jobType = (isMock ? job.jobType : job.job_type ?? job.jobType) ?? "fulltime"

  const location = isMock
    ? normalizeLocations(job.location ?? job.locations)
    : normalizeLocations(job.locations ?? job.location)

  const createdAt = isMock ? job.createdAt : job.created_at ?? job.createdAt
  const viewCount = isMock ? job.viewCount : job.view_count ?? job.viewCount

  const normalized: NormalizedJob = {
    id: job.id,
    title: job.title,
    company,
    department: job.department,
    location,
    salaryMin: salaryMin ?? undefined,
    salaryMax: salaryMax ?? undefined,
    jobType,
    educationRequirement: isMock ? job.educationRequirement : job.education_requirement ?? job.educationRequirement,
    tags: job.tags || [],
    applicationDeadline: (isMock ? job.applicationDeadline : job.application_deadline ?? job.applicationDeadline) || undefined,
    viewCount: viewCount ?? undefined,
    applicationCount: (isMock ? job.applicationCount : job.application_count ?? job.applicationCount) ?? undefined,
    isHot: job.isHot ?? (typeof viewCount === "number" && viewCount > 1000),
    isNew:
      job.isNew ??
      (createdAt ? new Date(createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 : false),
    hasReferral: job.hasReferral ?? job.has_referral ?? false,
  }

  return normalized
}
