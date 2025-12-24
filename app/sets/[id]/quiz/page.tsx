"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { QuizMode } from "@/components/quiz-mode"
import { getQuestionSetById, type QuestionSet } from "@/lib/question-sets"
import {
  type UserProgress,
  loadProgress,
  saveProgress,
  getDefaultProgress,
} from "@/lib/storage"
import { useAutoSave } from "@/lib/hooks/use-auto-save"

export default function SetQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [progress, setProgress] = useState<UserProgress>(getDefaultProgress())
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Use getUser() to properly validate the session with the server
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        setUser(currentUser)

        // Load question set
        const set = await getQuestionSetById(id)
        if (!set) {
          router.push("/explore")
          return
        }
        setQuestionSet(set)

        // Load progress
        const loadedProgress = await loadProgress(currentUser)
        setProgress(loadedProgress || getDefaultProgress())
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, router, id])

  const handleSetProgress = useCallback(
    async (newProgress: UserProgress) => {
      setProgress(newProgress)
      await saveProgress(user, newProgress)
    },
    [user]
  )

  // Auto-save when tab is hidden or app loses focus
  useAutoSave({
    onSave: useCallback(async () => {
      await saveProgress(user, progress)
    }, [user, progress]),
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Đang tải...</div>
      </div>
    )
  }

  if (!questionSet) {
    return null
  }

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8">
      <QuizMode
        progress={progress}
        setProgress={handleSetProgress}
        onBack={() => router.push(`/sets/${id}`)}
        questionSetId={id}
      />
    </main>
  )
}

