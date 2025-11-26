"use server"

import { auth } from "@/lib/auth"
import { db } from "@repo/db"
import { user, userCollections, userLikes } from "@repo/db/schema"
import { eq, and } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: {
  gender?: string
  address?: string
  contactPhone?: string
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    throw new Error("Unauthorized")
  }

  await db.update(user)
    .set({
      gender: data.gender,
      address: data.address,
      contactPhone: data.contactPhone,
    })
    .where(eq(user.id, session.user.id))

  revalidatePath("/user/profile")
  return { success: true }
}

export async function toggleCollection(jobId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id

  const existing = await db.select()
    .from(userCollections)
    .where(and(
      eq(userCollections.userId, userId),
      eq(userCollections.jobId, jobId) // Note: jobId in userCollections is uuid, but we pass string. Drizzle handles this? Yes usually.
    ))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(userCollections)
      .where(and(
        eq(userCollections.userId, userId),
        eq(userCollections.jobId, jobId)
      ))
    revalidatePath("/user/profile")
    return { collected: false }
  } else {
    await db.insert(userCollections)
      .values({
        userId,
        jobId
      })
    revalidatePath("/user/profile")
    return { collected: true }
  }
}

export async function toggleLike(jobId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id

  const existing = await db.select()
    .from(userLikes)
    .where(and(
      eq(userLikes.userId, userId),
      eq(userLikes.jobId, jobId)
    ))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(userLikes)
      .where(and(
        eq(userLikes.userId, userId),
        eq(userLikes.jobId, jobId)
      ))
    revalidatePath("/user/profile")
    return { liked: false }
  } else {
    await db.insert(userLikes)
      .values({
        userId,
        jobId
      })
    revalidatePath("/user/profile")
    return { liked: true }
  }
}
