"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SearchQuestions } from "@/components/search-questions"
import { loadProgress, getDefaultProgress, type UserProgress } from "@/lib/storage"
import type { Question } from "@/lib/questions"

export default function SearchPage() {
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

  const handleAskAI = (question: Question) => {
    // Store question in session storage or state management to pass to AI page
    sessionStorage.setItem("ai_initial_question", JSON.stringify(question))
    router.push("/ai")
  }

  if (loading || !progress) return <div className="p-8 text-center">Đang tải...</div>

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8">
      <SearchQuestions 
        progress={progress} 
        onBack={() => router.push("/")} 
        onAskAI={handleAskAI} 
      />
    </main>
  )
}

