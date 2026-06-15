import { createServerSupabaseClient } from "@/lib/supabase/server"
import { mapJobListing } from "../../_shared/mappers"
import { fail, getCurrentUser, ok } from "../../_shared/response"
import { db } from "@repo/db"
import { userJobListingCollections } from "@repo/db/schema"
import { and, eq } from "drizzle-orm"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("job_listings").select("*").eq("id", id).maybeSingle()

  if (error || !data) return fail("NOT_FOUND", "职位不存在", 404)

  const user = await getCurrentUser(request)
  let isCollected = false
  if (user?.id) {
    const row = await db.query.userJobListingCollections.findFirst({
      where: and(eq(userJobListingCollections.userId, user.id), eq(userJobListingCollections.jobListingId, id)),
      columns: { id: true },
    })
    isCollected = Boolean(row)
  }

  return ok({ ...mapJobListing(data), isCollected })
}
