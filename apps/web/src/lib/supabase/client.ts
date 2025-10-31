import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// 创建 Supabase 客户端（用于客户端组件）
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)!
  )
}

// 单例模式的客户端（可选）
let client: ReturnType<typeof createClient> | undefined

export function getSupabaseClient() {
  if (!client) {
    client = createClient()
  }
  return client
}