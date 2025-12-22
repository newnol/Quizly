"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/stats-card"
import { TopicProgress } from "@/components/topic-progress"
import { QuizMode } from "@/components/quiz-mode"
import { FlashcardMode } from "@/components/flashcard-mode"
import { SearchQuestions } from "@/components/search-questions"
import { Settings } from "@/components/settings"
import { AuthForm } from "@/components/auth-form"
import { UserMenu } from "@/components/user-menu"
import { ReviewHistory } from "@/components/review-history"
import { AIAssistant } from "@/components/ai-assistant"
import {
  type UserProgress,
  loadProgress,
  saveProgress,
  getDueCards,
  syncLocalToSupabase,
  getDefaultProgress,
} from "@/lib/storage"
import { questions, type Question } from "@/lib/questions"
import { BookOpen, Layers, Search, SettingsIcon, Brain, Zap, GraduationCap, History, Sparkles } from "lucide-react"

type View = "home" | "quiz" | "flashcard" | "search" | "settings" | "auth" | "review" | "ai"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [progress, setProgress] = useState<UserProgress>(getDefaultProgress())
  const [currentView, setCurrentView] = useState<View>("home")
  const [loading, setLoading] = useState(true)
  const [reviewQuestionIds, setReviewQuestionIds] = useState<string[] | null>(null)
  const [aiInitialQuestion, setAiInitialQuestion] = useState<Question | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const currentUser = session?.user ?? null
        setUser(currentUser)

        const loadedProgress = await loadProgress(currentUser)
        setProgress(loadedProgress || getDefaultProgress())
      } catch (error) {
        console.error("Error loading progress:", error)
        setProgress(getDefaultProgress())
      } finally {
        setLoading(false)
      }
    }

    initializeApp()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      try {
        if (event === "SIGNED_IN" && currentUser) {
          const syncedProgress = await syncLocalToSupabase(currentUser.id)
          setProgress(syncedProgress || getDefaultProgress())
        } else if (event === "SIGNED_OUT") {
          const localProgress = await loadProgress(null)
          setProgress(localProgress || getDefaultProgress())
        }
      } catch (error) {
        console.error("Error handling auth change:", error)
        setProgress(getDefaultProgress())
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSetProgress = useCallback(
    async (newProgress: UserProgress) => {
      setProgress(newProgress)
      await saveProgress(user, newProgress)
    },
    [user],
  )

  const handleReviewCards = (questionIds: string[]) => {
    setReviewQuestionIds(questionIds)
    setCurrentView("flashcard")
  }

  const handleAskAI = useCallback((question: Question) => {
    setAiInitialQuestion(question)
    setCurrentView("ai")
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Đang tải...</div>
      </div>
    )
  }

  if (currentView === "auth") {
    return <AuthForm onBack={() => setCurrentView("home")} onSuccess={() => setCurrentView("home")} />
  }

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Đang tải...</div>
      </div>
    )
  }

  const dueCount = getDueCards(
    progress,
    questions.map((q) => q.id),
  ).length

  const reviewedCount = Object.keys(progress.cardProgress).filter(
    (id) => progress.cardProgress[id]?.lastReviewDate,
  ).length

  if (currentView === "quiz") {
    return (
      <main className="container max-w-4xl mx-auto p-4 py-8">
        <QuizMode
          progress={progress}
          setProgress={handleSetProgress}
          onBack={() => setCurrentView("home")}
          onAskAI={handleAskAI}
        />
      </main>
    )
  }

  if (currentView === "flashcard") {
    return (
      <main className="container max-w-4xl mx-auto p-4 py-8">
        <FlashcardMode
          progress={progress}
          setProgress={handleSetProgress}
          onBack={() => {
            setCurrentView("home")
            setReviewQuestionIds(null)
          }}
          specificQuestionIds={reviewQuestionIds}
          onAskAI={handleAskAI}
        />
      </main>
    )
  }

  if (currentView === "search") {
    return (
      <main className="container max-w-4xl mx-auto p-4 py-8">
        <SearchQuestions progress={progress} onBack={() => setCurrentView("home")} onAskAI={handleAskAI} />
      </main>
    )
  }

  if (currentView === "settings") {
    return (
      <main className="container max-w-4xl mx-auto p-4 py-8">
        <Settings
          progress={progress}
          setProgress={handleSetProgress}
          onBack={() => setCurrentView("home")}
          user={user}
        />
      </main>
    )
  }

  if (currentView === "review") {
    return (
      <main className="container max-w-4xl mx-auto p-4 py-8">
        <ReviewHistory progress={progress} onBack={() => setCurrentView("home")} onReviewCards={handleReviewCards} />
      </main>
    )
  }

  if (currentView === "ai") {
    return (
      <main className="container max-w-4xl mx-auto p-4 py-8">
        <AIAssistant
          onBack={() => {
            setCurrentView("home")
            setAiInitialQuestion(null)
          }}
          initialQuestion={aiInitialQuestion}
        />
      </main>
    )
  }

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">Mạng Máy Tính</h1>
        </div>
        <UserMenu user={user} onLogin={() => setCurrentView("auth")} onLogout={() => {}} />
      </div>

      <p className="text-muted-foreground text-center -mt-4">Ôn tập hiệu quả với Spaced Repetition</p>

      <StatsCard progress={progress} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setCurrentView("quiz")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Quiz Mode
            </CardTitle>
            <CardDescription>Trắc nghiệm với phản hồi tức thì</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <BookOpen className="h-4 w-4 mr-2" />
              Bắt đầu Quiz
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => setCurrentView("flashcard")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Flashcard
              {dueCount > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {dueCount} cần ôn
                </span>
              )}
            </CardTitle>
            <CardDescription>Ôn tập với thuật toán SM-2</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent">
              <Layers className="h-4 w-4 mr-2" />
              Xem Flashcard
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-1 bg-transparent"
          onClick={() => setCurrentView("ai")}
        >
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Hỏi AI</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-1 bg-transparent"
          onClick={() => setCurrentView("review")}
        >
          <History className="h-5 w-5" />
          <span>Lịch sử</span>
          {reviewedCount > 0 && <span className="text-xs text-muted-foreground">{reviewedCount} thẻ</span>}
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-1 bg-transparent"
          onClick={() => setCurrentView("search")}
        >
          <Search className="h-5 w-5" />
          <span>Tìm kiếm</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-1 bg-transparent"
          onClick={() => setCurrentView("settings")}
        >
          <SettingsIcon className="h-5 w-5" />
          <span>Cài đặt</span>
        </Button>
      </div>

      <TopicProgress progress={progress} />

      <footer className="text-center text-sm text-muted-foreground pt-8">
        <p>100 câu hỏi về Mạng Máy Tính</p>
        <p className="mt-1">TCP, QoS, IPv6, Routing, SDN, Virtualization, Container, Cloud</p>
      </footer>
    </main>
  )
}
