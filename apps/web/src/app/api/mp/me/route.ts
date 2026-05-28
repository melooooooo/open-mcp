import { db } from "@repo/db"
import {
  scrapedJobs,
  user as userTable,
  userCollections,
  userExperienceLikes,
  userJobListingCollections,
} from "@repo/db/schema"
import { desc, eq, inArray } from "drizzle-orm"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { mapExperience, mapJobListing, mapReferral } from "../_shared/mappers"
import { fail, getCurrentUser, ok } from "../_shared/response"

export async function GET() {
  const user = await getCurrentUser()
  if (!user?.id) {
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
    user,
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
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return fail("UNAUTHORIZED", "请先登录", 401)

  const body = await request.json().catch(() => ({}))
  const values = {
    name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : currentUser.name,
    gender: typeof body.gender === "string" ? body.gender : undefined,
    address: typeof body.address === "string" ? body.address : undefined,
    contactPhone: typeof body.contactPhone === "string" ? body.contactPhone : undefined,
    updatedAt: new Date(),
  }

  await db.update(userTable).set(values).where(eq(userTable.id, currentUser.id))
  return ok({ saved: true })
}
