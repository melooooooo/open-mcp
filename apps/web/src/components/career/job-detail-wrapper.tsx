import { getJobById } from "@/lib/api/jobs"
import { JobDetailServerClient } from "./job-detail-server-client"
import { notFound } from "next/navigation"

export async function JobDetailWrapper({ jobId }: { jobId: string }) {
  // 获取职位详情
  const job = await getJobById(jobId)
  
  if (!job) {
    notFound()
  }
  
  // 处理职位数据格式
  const formattedJob = {
    id: job.id,
    title: job.title,
    company: {
      name: (job as any).company_name || '未知公司',
      logo: (job as any).company_logo,
      size: (job as any).company_size,
    },
    department: job.department,
    location: job.location || job.locations || [],
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
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits
  }
  
  return (
    <JobDetailServerClient job={formattedJob} />
  )
}
