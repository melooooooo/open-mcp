import { createBrowserClient } from '@supabase/ssr'
// Supabase类型文件已移除，如需严格类型可重新生成

// 创建 Supabase 客户端（用于客户端组件）
export function createClient() {
  return createBrowserClient(
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
