import { createBrowserClient } from "@supabase/ssr"
import { env } from "@/lib/env"

// Create a new client for each call to avoid stale auth state issues
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
