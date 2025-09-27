import { getJobById } from "@/lib/api/jobs"
import { getReferrals } from "@/lib/api/referrals"
import { JobDetailServerClient } from "./job-detail-server-client"
import { notFound } from "next/navigation"

export async function JobDetailWrapper({ jobId }: { jobId: string }) {
  // 获取职位详情
  const job = await getJobById(jobId)
  
  if (!job) {
    notFound()
  }
  
  // 获取所有内推机会（后续可以根据职位过滤）
  const allReferrals = await getReferrals()
  
  // 处理职位数据格式
  const formattedJob = {
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
    hasReferral: false,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits
  }
  
  // 处理内推数据格式
  const formattedReferrals = allReferrals.map(referral => ({
    id: referral.id,
    referrer: {
      id: referral.referrer?.id || '',
      name: referral.referrer?.name || '匿名',
      avatar: referral.referrer?.avatar,
      title: referral.referrer?.title || '',
      company: referral.referrer?.company || '',
      department: referral.referrer?.department,
      isVerified: referral.referrer?.is_verified,
      successRate: referral.referrer?.success_rate,
      totalReferred: referral.referrer?.total_referred
    },
    job: {
      title: referral.jobs?.title || '',
      department: referral.jobs?.department,
      location: referral.jobs?.locations || [],
      salaryRange: referral.jobs?.salary_min && referral.jobs?.salary_max ? 
        `${referral.jobs.salary_min}-${referral.jobs.salary_max}k` : '薪资面议'
    },
    quotaTotal: referral.quota_total,
    quotaUsed: referral.quota_used,
    validUntil: referral.valid_until,
    requirements: referral.requirements || [],
    tags: [],
    description: referral.description,
    rating: referral.rating,
    reviews: referral.review_count
  }))
  
  return (
    <JobDetailServerClient 
      job={formattedJob} 
      referrals={formattedReferrals}
    />
  )
}