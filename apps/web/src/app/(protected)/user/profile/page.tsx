import { auth } from "@/lib/auth"
import { db } from "@repo/db"
import { user } from "@repo/db/schema"
import { eq } from "drizzle-orm"
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

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfileContent user={userProfile} />
    </Suspense>
  )
}
