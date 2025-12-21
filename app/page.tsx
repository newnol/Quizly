"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/stats-card"
import { TopicProgress } from "@/components/topic-progress"
import { QuizMode } from "@/components/quiz-mode"
import { FlashcardMode } from "@/components/flashcard-mode"
import { SearchQuestions } from "@/components/search-questions"
import { Settings } from "@/components/settings"
import { type UserProgress, loadProgress, getDueCards } from "@/lib/storage"
import { questions } from "@/lib/questions"
import { BookOpen, Layers, Search, SettingsIcon, Brain, Zap, GraduationCap } from "lucide-react"

type View = "home" | "quiz" | "flashcard" | "search" | "settings"

export default function Home() {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [currentView, setCurrentView] = useState<View>("home")

  useEffect(() => {
    const loaded = loadProgress()
    setProgress(loaded)
  }, [])

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

  if (currentView === "quiz") {
    return (
      <main className="container max-w-4xl mx-auto p-4 py-8">
        <QuizMode progress={progress} setProgress={setProgress} onBack={() => setCurrentView("home")} />
      </main>
    )
  }

  if (currentView === "flashcard") {
    return (
      <main className="container max-w-4xl mx-auto p-4 py-8">
        <FlashcardMode progress={progress} setProgress={setProgress} onBack={() => setCurrentView("home")} />
      </main>
    )
  }

  if (currentView === "search") {
    return (
      <main className="container max-w-4xl mx-auto p-4 py-8">
        <SearchQuestions progress={progress} onBack={() => setCurrentView("home")} />
      </main>
    )
  }

  if (currentView === "settings") {
    return (
      <main className="container max-w-4xl mx-auto p-4 py-8">
        <Settings progress={progress} setProgress={setProgress} onBack={() => setCurrentView("home")} />
      </main>
    )
  }

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Mạng Máy Tính</h1>
        </div>
        <p className="text-muted-foreground">Ôn tập hiệu quả với Spaced Repetition</p>
      </div>

      {/* Stats */}
      <StatsCard progress={progress} />

      {/* Quick Actions */}
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

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Topic Progress */}
      <TopicProgress progress={progress} />

      {/* Footer */}
      <footer className="text-center text-sm text-muted-foreground pt-8">
        <p>100 câu hỏi về Mạng Máy Tính</p>
        <p className="mt-1">TCP, QoS, IPv6, Routing, SDN, Virtualization, Container, Cloud</p>
      </footer>
    </main>
  )
}
