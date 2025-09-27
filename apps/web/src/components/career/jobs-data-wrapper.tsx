import { getJobs } from "@/lib/api/jobs"
import { JobsClient } from "./jobs-client"

export async function JobsDataWrapper() {
  // 从数据库获取真实数据
  const allJobs = await getJobs()
  
  // 处理数据格式
  const jobs = allJobs.map(job => ({
    id: job.id,
    title: job.title,
    company: {
      name: job.companies?.name || '未知公司',
      logo: job.companies?.logo_url,
      size: job.companies?.size
    },
    department: job.department,
    location: job.locations || [],
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    jobType: job.job_type as "fulltime" | "intern" | "parttime",
    educationRequirement: job.education_requirement,
    tags: [],
    applicationDeadline: job.application_deadline,
    viewCount: job.view_count,
    applicationCount: job.application_count,
    isHot: job.view_count && job.view_count > 1000,
    isNew: job.created_at ? new Date(job.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 : false,
    hasReferral: false
  }))
  
  return <JobsClient jobs={jobs} />
}