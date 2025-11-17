import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createServerSupabaseClient()

  // Basic ping: ensure career_platform.job_sites 可读
  const { error: jobSitesError } = await supabase
    .from("cp_job_sites")
    .select("id")
    .limit(1)

  // Optionally try calling RPCs that are referenced in code if they exist
  let hasIncrementJobView = false
  try {
    // We call with an impossible id only to test function existence; ignore result
    const { error: rpcErr } = await supabase.rpc("increment_job_view", { job_id: "00000000-0000-0000-0000-000000000000" })
    // If error code is not "42883 function does not exist", we assume function exists or other error occurred
    hasIncrementJobView = !rpcErr || !/42883/.test(String(rpcErr.message))
  } catch {}

  const ok = !jobSitesError
  return NextResponse.json({
    ok,
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "present" : "missing",
      anon_or_publishable_key: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) ? "present" : "missing",
    },
    reads: {
      jobSitesReachable: !jobSitesError,
    },
    features: {
      rpc_increment_job_view_detected: hasIncrementJobView,
    },
    notes: [
      "If job_sites shows not reachable, confirm RLS policy allows public read and rows exist.",
      "This endpoint does not require auth and validates public read path only.",
    ],
    errors: {
      jobSites: jobSitesError?.message,
    },
  })
}
