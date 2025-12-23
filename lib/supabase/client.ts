import { createBrowserClient } from "@supabase/ssr"

// Create a new client for each call to avoid stale auth state issues
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
