"use server"

import { auth } from "@/lib/auth"
import { db } from "@repo/db"
import { user } from "@repo/db/schema"
import { eq } from "drizzle-orm"
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
