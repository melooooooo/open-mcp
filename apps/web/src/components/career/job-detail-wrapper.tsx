import { getJobById } from "@/lib/api/jobs"
import { JobDetailSimple } from "./job-detail-simple"
import { notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function JobDetailWrapper({ jobId }: { jobId: string }) {
  // 获取职位详情
  let job: any = await getJobById(jobId)
  let isJobListing = false

  if (!job) {
    // 尝试从 job_listings 表获取（服务端查询）
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from("job_listings")
      .select("*")
      .eq("id", jobId)
      .maybeSingle()
    job = data
    isJobListing = true
  }

  if (!job) {
    notFound()
  }

  // 处理职位数据格式
  let formattedJob;

  if (isJobListing) {
    // 映射 job_listings 数据
    formattedJob = {
      id: job.id,
      title: job.job_title,
      company: {
        name: job.company_name || '未知公司',
        logo: undefined, // job_listings 没有 logo
        size: undefined,
      },
      department: undefined,
      location: job.work_location ? [job.work_location] : [],
      salaryMin: undefined, // job_listings 没有解析后的薪资范围
      salaryMax: undefined,
      jobType: "fulltime", // 默认为全职，或者根据 job.session 判断
      educationRequirement: job.degree_requirement,
      tags: [job.company_type, job.industry_category].filter(Boolean),
      applicationDeadline: job.deadline,
      viewCount: 0, // job_listings 暂时没有 view_count
      applicationCount: 0,
      isHot: false,
      isNew: job.source_updated_at ? new Date(job.source_updated_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 : false,
      description: job.remark || job.announcement_source, // 使用备注或来源作为描述
      requirements: job.major_requirement,
      benefits: undefined,
      applicationMethod: job.application_method,
      publishDate: job.source_updated_at
    }
  } else {
    // 映射 cp_job_sites 数据 (原有逻辑)
    formattedJob = {
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
      benefits: job.benefits,
      applicationMethod: job.application_link,
      publishDate: job.publish_date || job.created_at
    }
  }

  return (
    <JobDetailSimple job={formattedJob} />
  )
}
