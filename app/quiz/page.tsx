"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { QuizMode } from "@/components/quiz-mode"
import { loadProgress, saveProgress, getDefaultProgress, type UserProgress } from "@/lib/storage"
import type { Question } from "@/lib/questions"

export default function GlobalQuizPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
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

  const handleAskAI = (question: Question) => {
    sessionStorage.setItem("ai_initial_question", JSON.stringify(question))
    router.push("/ai")
  }

  if (loading || !progress) return <div className="p-8 text-center">Đang tải...</div>

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8">
      <QuizMode
        progress={progress}
        setProgress={handleSetProgress}
        onBack={() => router.push("/")}
        onAskAI={handleAskAI}
      />
    </main>
  )
}

