"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/stats-card"
import { TopicProgress } from "@/components/topic-progress"
import { UserMenu } from "@/components/user-menu"
import { LanguageToggle } from "@/components/language-toggle"
import {
  type UserProgress,
  loadProgress,
  getDueCards,
  getDefaultProgress,
} from "@/lib/storage"
import { questions } from "@/lib/questions"
import { 
  BookOpen, 
  Layers, 
  Search, 
  SettingsIcon, 
  Brain, 
  Zap, 
  GraduationCap, 
  History,
  Globe,
  FolderOpen,
  Plus,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [progress, setProgress] = useState<UserProgress>(getDefaultProgress())
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const supabase = createClient()

  const initApp = useCallback(async (currentUser: User | null) => {
    try {
      const loadedProgress = await loadProgress(currentUser)
      setProgress(loadedProgress || getDefaultProgress())
    } catch (error) {
      console.error("App initialization error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    let isMounted = true

    // Safety timer to force end loading screen after 5 seconds
    const safetyTimer = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false)
      }
    }, 5000)

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        initApp(currentUser)
      }
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (_event === "SIGNED_IN" || _event === "SIGNED_OUT") {
          initApp(currentUser)
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearTimeout(safetyTimer)
    }
  }, [initApp])

  // Tránh lỗi Hydration: Render một bộ khung đơn giản trên Server
  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center" />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground mb-4">Đang tải dữ liệu...</div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLoading(false)}
          className="text-xs opacity-50 hover:opacity-100"
        >
          Bỏ qua nếu đợi quá lâu
        </Button>
      </div>
    )
  }

  const dueCount = getDueCards(
    progress,
    questions.map((q) => q.id),
  ).length

  const reviewedCount = Object.keys(progress.cardProgress).length

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">Quizly</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <UserMenu 
            user={user} 
            onLogin={() => router.push("/auth")} 
            onLogout={() => {}} 
          />
        </div>
      </div>

      <p className="text-muted-foreground text-center -mt-4">Ôn tập hiệu quả với Spaced Repetition</p>

      {/* Navigation to Question Sets */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => router.push("/explore")}
        >
          <CardHeader className="pb-3 text-center sm:text-left">
            <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-lg">
              <Globe className="h-5 w-5 text-blue-500" />
              Khám phá
            </CardTitle>
            <CardDescription className="hidden sm:block">Tìm bộ câu hỏi từ cộng đồng</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => user ? router.push("/my-sets") : router.push("/auth?returnTo=/my-sets")}
        >
          <CardHeader className="pb-3 text-center sm:text-left">
            <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-lg">
              <FolderOpen className="h-5 w-5 text-orange-500" />
              Bộ của tôi
            </CardTitle>
            <CardDescription className="hidden sm:block">Quản lý bộ câu hỏi của bạn</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Create New Set Button */}
      {user && (
        <Button 
          variant="outline" 
          className="w-full bg-transparent border-dashed" 
          asChild
        >
          <Link href="/sets/new">
            <Plus className="h-4 w-4 mr-2" />
            Tạo bộ câu hỏi mới
          </Link>
        </Button>
      )}

      {/* Default Question Set - Mạng Máy Tính */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Mạng Máy Tính</h2>
          <span className="text-sm text-muted-foreground">{questions.length} câu hỏi</span>
        </div>

        {/* Stats */}
        <StatsCard progress={progress} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push("/quiz")}>
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
            onClick={() => router.push("/flashcard")}
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
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-1 bg-transparent text-[10px] sm:text-sm"
            asChild
          >
            <Link href="/ai">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Hỏi AI</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-1 bg-transparent text-[10px] sm:text-sm"
            asChild
          >
            <Link href="/review">
              <History className="h-5 w-5" />
              <span>Lịch sử</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-1 bg-transparent text-[10px] sm:text-sm"
            asChild
          >
            <Link href="/search">
              <Search className="h-5 w-5" />
              <span>Tìm kiếm</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-1 bg-transparent text-[10px] sm:text-sm"
            asChild
          >
            <Link href="/settings">
              <SettingsIcon className="h-5 w-5" />
              <span>Cài đặt</span>
            </Link>
          </Button>
        </div>

        {/* Topic Progress */}
        <TopicProgress progress={progress} />
      </div>

      <footer className="text-center text-sm text-muted-foreground pt-8">
        <p>Tạo và chia sẻ bộ câu hỏi của riêng bạn</p>
      </footer>
    </main>
  )
}
