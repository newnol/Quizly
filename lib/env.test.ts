import { describe, it, expect, vi, beforeEach } from "vitest"

describe("Environment Variables", () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "dummy-key"
  })

  it("should validate correctly when all required vars are present", async () => {
    const { env } = await import("./env")
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co")
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("dummy-key")
  })

  it("should fall back to safe values but log error when missing required vars", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    
    const { env } = await import("./env")
    
    expect(consoleSpy).toHaveBeenCalled()
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("")
    
    consoleSpy.mockRestore()
  })
})

