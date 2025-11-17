import { getJobs } from "@/lib/api/jobs"
import { HomeClient } from "./home-client"
import { mockExperiences, mockCompanies, mockJobs, mockStats } from "@/data/mock-data"
import { normalizeJobRecord } from "@/lib/normalizers/job"

export async function HomeDataWrapper() {
  // 从数据库获取真实数据
  const allJobs = await getJobs()

  const isJobFallback = allJobs.length === 0

  const jobSource = (isJobFallback ? mockJobs : allJobs) as Parameters<typeof normalizeJobRecord>[0][]

  const jobs = jobSource.map((job) => normalizeJobRecord(job))

  const stats = {
    totalJobs: { value: isJobFallback ? mockStats.totalJobs : jobs.length, isEstimate: isJobFallback },
    totalCompanies: { value: mockStats.totalCompanies, isEstimate: true },
    totalUsers: { value: mockStats.totalUsers, isEstimate: true },
    successRate: { value: mockStats.successRate, isEstimate: true },
  }

  return (
    <HomeClient
      jobs={jobs}
      experiences={mockExperiences}
      companies={mockCompanies}
      stats={stats}
    />
  )
}
