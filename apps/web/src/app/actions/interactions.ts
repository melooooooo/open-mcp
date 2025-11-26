"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@repo/db"
import {
  userJobListingCollections,
  userExperienceLikes,
  financeExperiences
} from "@repo/db/schema"
import { eq, and, sql, inArray } from "drizzle-orm"

export async function toggleJobListingCollection(jobId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const userId = session.user.id

  try {
    const existing = await db.query.userJobListingCollections.findFirst({
      where: and(
        eq(userJobListingCollections.userId, userId),
        eq(userJobListingCollections.jobListingId, jobId)
      ),
    })

    if (existing) {
      await db
        .delete(userJobListingCollections)
        .where(
          and(
            eq(userJobListingCollections.userId, userId),
            eq(userJobListingCollections.jobListingId, jobId)
          )
        )
      return { isCollected: false }
    } else {
      await db.insert(userJobListingCollections).values({
        userId,
        jobListingId: jobId,
      })
      return { isCollected: true }
    }
  } catch (error) {
    console.error("Error toggling job collection:", error)
    return { error: "Failed to toggle collection" }
  } finally {
    revalidatePath("/recruitment")
    revalidatePath("/user/profile")
  }
}

export async function toggleExperienceLike(experienceId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const userId = session.user.id

  try {
    const existing = await db.query.userExperienceLikes.findFirst({
      where: and(
        eq(userExperienceLikes.userId, userId),
        eq(userExperienceLikes.experienceId, experienceId)
      ),
    })

    if (existing) {
      await db.transaction(async (tx) => {
        await tx
          .delete(userExperienceLikes)
          .where(
            and(
              eq(userExperienceLikes.userId, userId),
              eq(userExperienceLikes.experienceId, experienceId)
            )
          )

        await tx
          .update(financeExperiences)
          .set({
            likeCount: sql`${financeExperiences.likeCount} - 1`
          })
          .where(eq(financeExperiences.id, experienceId))
      })
      return { isLiked: false }
    } else {
      await db.transaction(async (tx) => {
        await tx.insert(userExperienceLikes).values({
          userId,
          experienceId,
        })

        await tx
          .update(financeExperiences)
          .set({
            likeCount: sql`${financeExperiences.likeCount} + 1`
          })
          .where(eq(financeExperiences.id, experienceId))
      })
      return { isLiked: true }
    }
  } catch (error) {
    console.error("Error toggling experience like:", error)
    return { error: "Failed to toggle like" }
  } finally {
    revalidatePath("/experiences")
    revalidatePath(`/experiences/${experienceId}`) // This might not work if slug is used, but we'll revalidate list at least
    revalidatePath("/user/profile")
  }
}

export async function getJobCollectionStatus(jobIds: string[]) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id || jobIds.length === 0) {
    return {}
  }

  const userId = session.user.id

  try {
    const collections = await db.query.userJobListingCollections.findMany({
      where: and(
        eq(userJobListingCollections.userId, userId),
        inArray(userJobListingCollections.jobListingId, jobIds)
      ),
      columns: {
        jobListingId: true
      }
    })

    const statusMap: Record<string, boolean> = {}
    collections.forEach(c => {
      statusMap[c.jobListingId] = true
    })

    return statusMap
  } catch (error) {
    console.error("Error fetching job collection status:", error)
    return {}
  }
}
