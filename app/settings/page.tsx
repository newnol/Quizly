"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Settings } from "@/components/settings"
import { loadProgress, saveProgress, getDefaultProgress, type UserProgress } from "@/lib/storage"

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      const loadedProgress = await loadProgress(currentUser)
      setProgress(loadedProgress || getDefaultProgress())
      setLoading(false)
    }
    init()
  }, [])

  const handleSetProgress = async (newProgress: UserProgress) => {
    setProgress(newProgress)
    await saveProgress(user, newProgress)
  }

  if (loading || !progress) return <div className="p-8 text-center">Đang tải...</div>

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8">
      <Settings
        progress={progress}
        setProgress={handleSetProgress}
        onBack={() => router.push("/")}
        user={user}
      />
    </main>
  )
}

