"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ReviewHistory } from "@/components/review-history"
import { loadProgress, getDefaultProgress, type UserProgress } from "@/lib/storage"

export default function ReviewPage() {
  const router = useRouter()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const loadedProgress = await loadProgress(user)
      setProgress(loadedProgress || getDefaultProgress())
      setLoading(false)
    }
    init()
  }, [])

  const handleReviewCards = (questionIds: string[]) => {
    // For now, redirecting to flashcard mode with specific IDs is tricky without a set ID.
    // The current app uses the default set for this on the home page.
    // We'll use a special path or search param for this.
    router.push(`/flashcard?ids=${questionIds.join(",")}`)
  }

  if (loading || !progress) return <div className="p-8 text-center">Đang tải...</div>

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8">
      <ReviewHistory 
        progress={progress} 
        onBack={() => router.push("/")} 
        onReviewCards={handleReviewCards} 
      />
    </main>
  )
}

