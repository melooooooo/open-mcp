import { db } from "@repo/db"
import {
  scrapedJobs,
  user as userTable,
  userCollections,
  userExperienceLikes,
  userJobListingCollections,
} from "@repo/db/schema"
import { desc, eq } from "drizzle-orm"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { mapExperience, mapJobListing, mapReferral } from "../_shared/mappers"
import { fail, getCurrentUser, ok, toMpUser } from "../_shared/response"

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser?.id) {
    return ok({
      user: null,
      stats: { collections: 0, likes: 0, history: 0 },
      collections: [],
      likes: [],
    })
  }

  const user = await db.query.user.findFirst({
    where: eq(userTable.id, currentUser.id),
  })
  if (!user) {
    return ok({
      user: null,
      stats: { collections: 0, likes: 0, history: 0 },
      collections: [],
      likes: [],
    })
  }

  const [referralCollections, listingCollections, experienceLikes] = await Promise.all([
    db
      .select({ job: scrapedJobs, collectedAt: userCollections.createdAt })
      .from(scrapedJobs)
      .innerJoin(userCollections, eq(scrapedJobs.id, userCollections.jobId))
      .where(eq(userCollections.userId, user.id))
      .orderBy(desc(userCollections.createdAt))
      .limit(50),
    db.query.userJobListingCollections.findMany({
      where: eq(userJobListingCollections.userId, user.id),
      orderBy: desc(userJobListingCollections.createdAt),
      columns: { jobListingId: true, createdAt: true },
      limit: 50,
    }),
    db.query.userExperienceLikes.findMany({
      where: eq(userExperienceLikes.userId, user.id),
      orderBy: desc(userExperienceLikes.createdAt),
      columns: { experienceId: true, createdAt: true },
      limit: 50,
    }),
  ])

  const supabase = await createServerSupabaseClient()
  const listingIds = listingCollections.map((item) => item.jobListingId)
  const experienceIds = experienceLikes.map((item) => item.experienceId)

  const [listingsResult, experiencesResult] = await Promise.all([
    listingIds.length
      ? supabase.from("job_listings").select("*").in("id", listingIds)
      : Promise.resolve({ data: [] as any[] }),
    experienceIds.length
      ? supabase
          .from("finance_experiences")
          .select("id, slug, title, author_name, organization_name, article_type, job_title, tags, like_count, publish_time, summary, cover_asset_path")
          .in("id", experienceIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const listingCollectionTime = new Map(listingCollections.map((item) => [item.jobListingId, item.createdAt]))
  const likeTime = new Map(experienceLikes.map((item) => [item.experienceId, item.createdAt]))

  const collections = [
    ...referralCollections.map(({ job, collectedAt }) => ({
      type: "referral",
      collectedAt,
      item: mapReferral(job),
    })),
    ...(listingsResult.data || []).map((item) => ({
      type: "job",
      collectedAt: listingCollectionTime.get(item.id) || null,
      item: mapJobListing(item),
    })),
  ].sort((a, b) => new Date(b.collectedAt || 0).getTime() - new Date(a.collectedAt || 0).getTime())

  const likes = (experiencesResult.data || [])
    .map((item) => ({
      likedAt: likeTime.get(item.id) || null,
      item: mapExperience(item),
    }))
    .sort((a, b) => new Date(b.likedAt || 0).getTime() - new Date(a.likedAt || 0).getTime())

  return ok({
    user: toMpUser(user),
    stats: {
      collections: collections.length,
      likes: likes.length,
      history: 0,
    },
    collections,
    likes,
  })
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser?.id) return fail("UNAUTHORIZED", "请先登录", 401)

  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.id, currentUser.id),
  })
  if (!existingUser) return fail("NOT_FOUND", "用户不存在", 404)

  const body = await request.json().catch(() => ({}))
  const nextName = typeof body.name === "string" && body.name.trim() ? body.name.trim() : existingUser.name
  const nextImage =
    body.image === null
      ? null
      : typeof body.image === "string"
        ? body.image.trim() || null
        : existingUser.image
  const nextGender = typeof body.gender === "string" ? body.gender : existingUser.gender
  const nextAddress = typeof body.address === "string" ? body.address : existingUser.address
  const nextContactPhone =
    typeof body.contactPhone === "string" ? body.contactPhone : existingUser.contactPhone
  const completeProfile = Boolean(body.completeProfile)
  const values: Partial<typeof userTable.$inferInsert> = {
    name: nextName,
    updatedAt: new Date(),
  }

  if (body.image !== undefined) values.image = nextImage
  if (body.gender !== undefined) values.gender = nextGender
  if (body.address !== undefined) values.address = nextAddress
  if (body.contactPhone !== undefined) values.contactPhone = nextContactPhone
  if (completeProfile) values.profileCompletedAt = new Date()

  await db.update(userTable).set(values).where(eq(userTable.id, existingUser.id))
  const updatedUser = await db.query.user.findFirst({
    where: eq(userTable.id, existingUser.id),
  })

  return ok({
    saved: true,
    user: toMpUser(updatedUser),
  })
}
