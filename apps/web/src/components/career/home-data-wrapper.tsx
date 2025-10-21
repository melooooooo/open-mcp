import { getJobs } from "@/lib/api/jobs"
import { getReferrals } from "@/lib/api/referrals"
import { HomeClient } from "./home-client"
import { mockExperiences, mockCompanies, mockJobs, mockReferrals, mockStats } from "@/data/mock-data"
import { normalizeJobRecord } from "@/lib/normalizers/job"

export async function HomeDataWrapper() {
  // 从数据库获取真实数据
  const allJobs = await getJobs()
  const allReferrals = await getReferrals()
  
  const isJobFallback = allJobs.length === 0
  const isReferralFallback = allReferrals.length === 0

  const jobSource = (isJobFallback ? mockJobs : allJobs) as Parameters<typeof normalizeJobRecord>[0][]
  const referralSource = isReferralFallback ? mockReferrals : allReferrals

  const jobs = jobSource.map((job) => normalizeJobRecord(job))

  const referrals = referralSource.map((referral: any) => {
    const isMock = !!referral.referrer?.name

    return {
      id: referral.id,
      referrer: {
        id: referral.referrer?.id || "",
        name: referral.referrer?.full_name || referral.referrer?.name || "匿名",
        avatar: referral.referrer?.avatar_url || referral.referrer?.avatar,
        title: referral.referrer?.title || referral.referrer?.bio || "",
        company: referral.referrer?.company || "",
        department: referral.referrer?.department || "",
        isVerified: referral.referrer?.is_verified ?? referral.referrer?.isVerified ?? false,
        successRate: referral.referrer?.success_rate || referral.referrer?.successRate || 85,
        totalReferred: referral.referrer?.total_referred || referral.referrer?.totalReferred || 20,
      },
      job: {
        title: referral.jobs?.title || referral.job?.title || "",
        department: referral.jobs?.department || referral.job?.department,
        location:
          referral.jobs?.locations ||
          referral.job?.location ||
          referral.job?.locations ||
          [],
        salaryRange:
          referral.jobs?.salary_min && referral.jobs?.salary_max
            ? `${referral.jobs.salary_min}-${referral.jobs.salary_max}k`
            : referral.job?.salaryRange || "薪资面议",
      },
      quotaTotal: referral.quota_total ?? referral.quotaTotal,
      quotaUsed: referral.quota_used ?? referral.quotaUsed,
      validUntil: referral.valid_until ?? referral.validUntil,
      requirements: referral.requirements || [],
      tags: referral.tags || [],
      description: referral.description,
      rating: referral.rating ?? 4.8,
      reviews: referral.reviews ?? 15,
    }
  })

  const stats = {
    totalJobs: { value: isJobFallback ? mockStats.totalJobs : jobs.length, isEstimate: isJobFallback },
    totalReferrals: {
      value: isReferralFallback ? mockStats.totalReferrals : referrals.length,
      isEstimate: isReferralFallback,
    },
    totalCompanies: { value: mockStats.totalCompanies, isEstimate: true },
    totalUsers: { value: mockStats.totalUsers, isEstimate: true },
    successRate: { value: mockStats.successRate, isEstimate: true },
  }

  return (
    <HomeClient 
      jobs={jobs}
      referrals={referrals}
      experiences={mockExperiences}
      companies={mockCompanies}
      stats={stats}
    />
  )
}
