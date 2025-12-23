"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  getQuestionSetById,
  getQuestionsBySetId,
  copyQuestionSet,
  getShareUrl,
  type QuestionSet,
  type Question,
} from "@/lib/question-sets"
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Copy,
  Globe,
  History,
  Layers,
  Link2,
  Lock,
  Pencil,
  Share2,
  Check,
} from "lucide-react"
import Link from "next/link"

export default function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [copying, setCopying] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

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
        setQuestions(dbQuestions)
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

  const isOwner = user && questionSet && user.id === questionSet.owner_id

  const handleCopy = async () => {
    if (!user) {
      router.push("/?login=true")
      return
    }

    setCopying(true)
    try {
      const newSet = await copyQuestionSet(user.id, id)
      if (newSet) {
        router.push(`/sets/${newSet.id}`)
      }
    } catch (error) {
      console.error("Error copying question set:", error)
      alert("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setCopying(false)
    }
  }

  const handleShareLink = async () => {
    const url = getShareUrl(id)
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error("Error copying link:", error)
    }
  }

  const visibilityIcon = {
    public: <Globe className="h-4 w-4" />,
    private: <Lock className="h-4 w-4" />,
    unlisted: <Link2 className="h-4 w-4" />,
  }

  const visibilityLabel = {
    public: "Công khai",
    private: "Riêng tư",
    unlisted: "Có link",
  }

  // Get unique topics
  const topics = [...new Set(questions.map((q) => q.topic).filter(Boolean))]

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
    <main className="container max-w-4xl mx-auto p-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="mt-1" asChild>
            <Link href={isOwner ? "/my-sets" : "/explore"}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{questionSet.title}</h1>
            {questionSet.description && (
              <p className="text-muted-foreground mt-1">{questionSet.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {visibilityIcon[questionSet.visibility]}
                {visibilityLabel[questionSet.visibility]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {questionSet.question_count} câu hỏi
              </span>
              {questionSet.copy_count > 0 && (
                <span className="text-sm text-muted-foreground">
                  • {questionSet.copy_count} lượt sao chép
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <Button variant="outline" asChild>
              <Link href={`/sets/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Link>
            </Button>
          ) : (
            <Button variant="outline" onClick={handleCopy} disabled={copying}>
              <Copy className="h-4 w-4 mr-2" />
              {copying ? "Đang sao chép..." : "Sao chép"}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleShareLink}>
            {linkCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Topics */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <Badge key={topic} variant="outline">
              {topic}
            </Badge>
          ))}
        </div>
      )}

      {/* Action Cards */}
      {questions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => router.push(`/sets/${id}/quiz`)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-yellow-500" />
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
            onClick={() => router.push(`/sets/${id}/flashcard`)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Flashcard
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

          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => router.push(`/sets/${id}/history`)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-500" />
                Lịch sử
              </CardTitle>
              <CardDescription>Xem tiến độ và câu yếu</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent">
                <History className="h-4 w-4 mr-2" />
                Xem lịch sử
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Bộ câu hỏi này chưa có câu hỏi nào.</p>
            {isOwner && (
              <Button className="mt-4" asChild>
                <Link href={`/sets/${id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Thêm câu hỏi
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Question Preview */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Xem trước câu hỏi</h2>
          <div className="space-y-3">
            {questions.slice(0, 5).map((q, index) => (
              <Card key={q.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center shrink-0">
                      {index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{q.question}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {q.topic && (
                          <Badge variant="secondary" className="text-xs">
                            {q.topic}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {q.options.length} đáp án
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {questions.length > 5 && (
              <p className="text-center text-sm text-muted-foreground">
                và {questions.length - 5} câu hỏi khác...
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

