import { auth } from "@/lib/auth"
import { db } from "@repo/db"
import {
  user,
  scrapedJobs,
  userCollections,
  userJobListingCollections,
  userExperienceLikes,
} from "@repo/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { UserProfileContent } from "./profile-content"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export default async function UserProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/auth/sign-in")
  }

  const userProfile = await db.query.user.findFirst({
    where: eq(user.id, session.user.id)
  })

  if (!userProfile) {
    redirect("/auth/sign-in")
  }

  // Fetch collected jobs (Scraped Jobs / Referrals)
  const collectedJobsData = await db
    .select({
      job: scrapedJobs,
      collectedAt: userCollections.createdAt,
    })
    .from(scrapedJobs)
    .innerJoin(userCollections, eq(scrapedJobs.id, userCollections.jobId))
    .where(eq(userCollections.userId, session.user.id))
    .orderBy(desc(userCollections.createdAt))


  // Fetch collected job listings (Recruitment) via Supabase
  const supabase = await createServerSupabaseClient()
  const collectedJobListingIds = await db.query.userJobListingCollections.findMany({
    where: eq(userJobListingCollections.userId, session.user.id),
    orderBy: desc(userJobListingCollections.createdAt),
    columns: {
      jobListingId: true,
      createdAt: true,
    }
  })

  const collectedJobListingsData = []
  if (collectedJobListingIds.length > 0) {
    const { data } = await supabase
      .from('job_listings')
      .select('*')
      .in('id', collectedJobListingIds.map(c => c.jobListingId))

    if (data) {
      // Map with collection timestamps
      for (const listing of data) {
        const collectionRecord = collectedJobListingIds.find(c => c.jobListingId === listing.id)
        collectedJobListingsData.push({
          ...listing,
          collectedAt: collectionRecord?.createdAt
        })
      }
      // Sort by collectedAt
      collectedJobListingsData.sort((a, b) => {
        if (!a.collectedAt || !b.collectedAt) return 0
        return new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
      })
    }
  }

  // Fetch liked experiences via Supabase
  const likedExperienceIds = await db.query.userExperienceLikes.findMany({
    where: eq(userExperienceLikes.userId, session.user.id),
    orderBy: desc(userExperienceLikes.createdAt),
    columns: {
      experienceId: true,
      createdAt: true,
    }
  })

  const likedExperiencesData = []
  if (likedExperienceIds.length > 0) {
    const { data } = await supabase
      .from('finance_experiences')
      .select('id, slug, title, author_name, organization_name, article_type, job_title, tags, like_count, publish_time, summary, cover_asset_path')
      .in('id', likedExperienceIds.map(c => c.experienceId))

    if (data) {
      // Map with like timestamps
      for (const exp of data) {
        const likeRecord = likedExperienceIds.find(c => c.experienceId === exp.id)
        likedExperiencesData.push({
          ...exp,
          likedAt: likeRecord?.createdAt
        })
      }
      // Sort by likedAt
      likedExperiencesData.sort((a, b) => {
        if (!a.likedAt || !b.likedAt) return 0
        return new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime()
      })
    }
  }

  // Format data for client component - serialize Date objects to ISO strings
  const collectedJobs = collectedJobsData.map(item => ({
    ...item.job,
    id: item.job.id,
    title: item.job.title,
    link: item.job.link,
    content: item.job.content,
    author: item.job.author,
    replyCount: item.job.replyCount,
    lastReplyDate: item.job.lastReplyDate,
    publishDate: item.job.publishDate,
    isTop: item.job.isTop,
    companyName: item.job.companyName,
    jobType: item.job.jobType,
    location: item.job.location,
    salary: item.job.salary,
    source: item.job.source,
    externalId: item.job.externalId,
    createdAt: item.job.createdAt?.toISOString() ?? null,
    updatedAt: item.job.updatedAt?.toISOString() ?? null,
    collectedAt: item.collectedAt?.toISOString() ?? null,
    isCollected: true
  }))

  // Serialize userProfile Date objects
  const serializedUser = {
    ...userProfile,
    createdAt: userProfile.createdAt?.toISOString() ?? null,
    updatedAt: userProfile.updatedAt?.toISOString() ?? null,
    banExpires: userProfile.banExpires?.toISOString() ?? null,
  }

  // Serialize job listings collections
  const collectedJobListings = collectedJobListingsData.map(item => ({
    id: item.id,
    companyName: item.company_name,
    jobTitle: item.job_title,
    workLocation: item.work_location,
    degreeRequirement: item.degree_requirement,
    companyType: item.company_type,
    industryCategory: item.industry_category,
    session: item.session,
    batch: item.batch,
    applicationMethod: item.application_method,
    sourceUpdatedAt: item.source_updated_at,
    createdAt: item.created_at,
    collectedAt: item.collectedAt?.toISOString() ?? null,
  }))

  // Serialize liked experiences
  const likedExperiences = likedExperiencesData.map(item => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    authorName: item.author_name,
    organizationName: item.organization_name,
    articleType: item.article_type,
    jobTitle: item.job_title,
    tags: item.tags,
    likeCount: item.like_count,
    publishTime: item.publish_time,
    summary: item.summary,
    coverAssetPath: item.cover_asset_path,
    likedAt: item.likedAt?.toISOString() ?? null,
  }))

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfileContent
        user={serializedUser}
        collectedJobs={collectedJobs}
        collectedJobListings={collectedJobListings}
        likedExperiences={likedExperiences}
      />
    </Suspense>
  )
}

