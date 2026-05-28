import { createServerSupabaseClient } from "@/lib/supabase/server"
import { mapReferral } from "../../_shared/mappers"
import { fail, getCurrentUser, ok } from "../../_shared/response"
import { db } from "@repo/db"
import { userCollections } from "@repo/db/schema"
import { and, eq } from "drizzle-orm"

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("scraped_jobs").select("*").eq("id", id).maybeSingle()
  if (error || !data) return fail("NOT_FOUND", "内推不存在", 404)

  const user = await getCurrentUser()
  let isCollected = false
  if (user?.id) {
    const row = await db.query.userCollections.findFirst({
      where: and(eq(userCollections.userId, user.id), eq(userCollections.jobId, id)),
      columns: { id: true },
    })
    isCollected = Boolean(row)
  }

  return ok({ ...mapReferral(data), isCollected })
}

