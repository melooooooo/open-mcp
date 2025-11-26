import { auth } from "@/lib/auth"
import { db } from "@repo/db"
import { user, scrapedJobs, userCollections, userLikes } from "@repo/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { UserProfileContent } from "./profile-content"

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

  // Fetch collected jobs
  const collectedJobsData = await db
    .select({
      job: scrapedJobs,
      collectedAt: userCollections.createdAt,
      isLiked: sql<boolean>`CASE WHEN ${userLikes.id} IS NOT NULL THEN true ELSE false END`
    })
    .from(scrapedJobs)
    .innerJoin(userCollections, eq(scrapedJobs.id, userCollections.jobId))
    .leftJoin(userLikes, and(eq(scrapedJobs.id, userLikes.jobId), eq(userLikes.userId, session.user.id)))
    .where(eq(userCollections.userId, session.user.id))
    .orderBy(desc(userCollections.createdAt))

  // Fetch liked jobs
  const likedJobsData = await db
    .select({
      job: scrapedJobs,
      likedAt: userLikes.createdAt,
      isCollected: sql<boolean>`CASE WHEN ${userCollections.id} IS NOT NULL THEN true ELSE false END`
    })
    .from(scrapedJobs)
    .innerJoin(userLikes, eq(scrapedJobs.id, userLikes.jobId))
    .leftJoin(userCollections, and(eq(scrapedJobs.id, userCollections.jobId), eq(userCollections.userId, session.user.id)))
    .where(eq(userLikes.userId, session.user.id))
    .orderBy(desc(userLikes.createdAt))

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
    isLiked: item.isLiked,
    isCollected: true
  }))

  const likedJobs = likedJobsData.map(item => ({
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
    likedAt: item.likedAt?.toISOString() ?? null,
    isCollected: item.isCollected,
    isLiked: true
  }))

  // Serialize userProfile Date objects
  const serializedUser = {
    ...userProfile,
    createdAt: userProfile.createdAt?.toISOString() ?? null,
    updatedAt: userProfile.updatedAt?.toISOString() ?? null,
    banExpires: userProfile.banExpires?.toISOString() ?? null,
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfileContent
        user={serializedUser}
        collectedJobs={collectedJobs}
        likedJobs={likedJobs}
      />
    </Suspense>
  )
}
