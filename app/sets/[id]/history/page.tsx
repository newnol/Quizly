"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { SetReviewHistory } from "@/components/set-review-history"
import { FlashcardMode } from "@/components/flashcard-mode"
import { getQuestionSetById, getQuestionsBySetId, type QuestionSet } from "@/lib/question-sets"
import { type Question, dbQuestionToAppQuestion } from "@/lib/questions"
import {
  type UserProgress,
  loadProgress,
  saveProgress,
  getDefaultProgress,
} from "@/lib/storage"

export default function SetHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [progress, setProgress] = useState<UserProgress>(getDefaultProgress())
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewQuestionIds, setReviewQuestionIds] = useState<string[] | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const currentUser = session?.user ?? null
        setUser(currentUser)

        // Load question set
        const set = await getQuestionSetById(id)
        if (!set) {
          router.push("/explore")
          return
        }
        setQuestionSet(set)

        // Load questions
        const dbQuestions = await getQuestionsBySetId(id)
        setQuestions(dbQuestions.map(dbQuestionToAppQuestion))

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

  const handleReviewCards = (questionIds: string[]) => {
    setReviewQuestionIds(questionIds)
  }

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

  // Show flashcard mode if reviewing specific questions
  if (reviewQuestionIds) {
    return (
      <main className="container max-w-4xl mx-auto p-4 py-8">
        <FlashcardMode
          progress={progress}
          setProgress={handleSetProgress}
          onBack={() => setReviewQuestionIds(null)}
          specificQuestionIds={reviewQuestionIds}
          questionSetId={id}
        />
      </main>
    )
  }

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8">
      <SetReviewHistory
        progress={progress}
        questions={questions}
        questionSetTitle={questionSet.title}
        onBack={() => router.push(`/sets/${id}`)}
        onReviewCards={handleReviewCards}
      />
    </main>
  )
}

