import { getJobs } from "@/lib/api/jobs"
import { getReferrals } from "@/lib/api/referrals"
import { HomeClient } from "./home-client"
import { mockExperiences, mockCompanies } from "@/data/mock-data"

export async function HomeDataWrapper() {
  // 从数据库获取真实数据
  const allJobs = await getJobs()
  const allReferrals = await getReferrals()
  
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
  
  const referrals = allReferrals.map(referral => ({
    id: referral.id,
    referrer: {
      id: referral.referrer?.id || '',
      name: referral.referrer?.full_name || '匿名',
      avatar: referral.referrer?.avatar_url,
      title: '', // 从bio中提取或使用默认值
      company: '', // 需要从其他地方获取或使用默认值
      department: '',
      isVerified: referral.referrer?.is_verified,
      successRate: 85, // 模拟数据，实际可能需要从其他表计算
      totalReferred: 20 // 模拟数据
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
    rating: 4.8, // 模拟数据
    reviews: 15 // 模拟数据
  }))
  
  return (
    <HomeClient 
      jobs={jobs}
      referrals={referrals}
      experiences={mockExperiences}
      companies={mockCompanies}
    />
  )
}