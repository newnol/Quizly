"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { FlashcardMode } from "@/components/flashcard-mode"
import { loadProgress, saveProgress, getDefaultProgress, type UserProgress } from "@/lib/storage"
import type { Question } from "@/lib/questions"

function FlashcardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const idsParam = searchParams.get("ids")
  const specificQuestionIds = idsParam ? idsParam.split(",") : null

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

  const handleAskAI = (question: Question) => {
    sessionStorage.setItem("ai_initial_question", JSON.stringify(question))
    router.push("/ai")
  }

  if (loading || !progress) return <div className="p-8 text-center">Đang tải...</div>

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8">
      <FlashcardMode
        progress={progress}
        setProgress={handleSetProgress}
        onBack={() => router.push("/")}
        specificQuestionIds={specificQuestionIds}
        onAskAI={handleAskAI}
      />
    </main>
  )
}

export default function GlobalFlashcardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <FlashcardContent />
    </Suspense>
  )
}

