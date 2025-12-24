"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { type UserProgress } from "@/lib/storage"
import { type Question } from "@/lib/questions"
import { 
  ArrowLeft, 
  Brain, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface SetReviewHistoryProps {
  progress: UserProgress
  questions: Question[]
  questionSetTitle: string
  onBack: () => void
  onReviewCards: (questionIds: string[]) => void
}

type FilterTab = "all" | "weak" | "strong" | "new" | "bookmarked"

export function SetReviewHistory({
  progress,
  questions,
  questionSetTitle,
  onBack,
  onReviewCards,
}: SetReviewHistoryProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all")

  const questionIds = useMemo(() => questions.map((q) => q.id), [questions])

  const categorizedQuestions = useMemo(() => {
    const now = new Date()
    
    const result = {
      all: questions,
      weak: [] as Question[],
      strong: [] as Question[],
      new: [] as Question[],
      bookmarked: [] as Question[],
      due: [] as Question[],
    }

    questions.forEach((q) => {
      const card = progress.cardProgress[q.id]
      
      if (!card || !card.lastReviewDate) {
        result.new.push(q)
      } else {
        // Weak: low ease factor or few repetitions
        if (card.easeFactor < 2.3 || card.repetitions < 2) {
          result.weak.push(q)
        } else {
          result.strong.push(q)
        }

        // Due for review
        if (new Date(card.nextReviewDate) <= now) {
          result.due.push(q)
        }
      }

      if (progress.bookmarkedQuestions.includes(q.id)) {
        result.bookmarked.push(q)
      }
    })

    return result
  }, [questions, progress])

  const stats = useMemo(() => {
    const reviewed = questions.filter((q) => progress.cardProgress[q.id]?.lastReviewDate).length
    const total = questions.length
    const avgEase = questions.reduce((sum, q) => {
      const card = progress.cardProgress[q.id]
      return sum + (card?.easeFactor || 2.5)
    }, 0) / total

    return {
      total,
      reviewed,
      newCount: categorizedQuestions.new.length,
      weakCount: categorizedQuestions.weak.length,
      strongCount: categorizedQuestions.strong.length,
      dueCount: categorizedQuestions.due.length,
      bookmarkedCount: categorizedQuestions.bookmarked.length,
      avgEase: avgEase.toFixed(2),
      progressPercent: Math.round((reviewed / total) * 100),
    }
  }, [questions, progress, categorizedQuestions])

  const displayedQuestions = categorizedQuestions[activeTab]

  const getQuestionStatus = (q: Question) => {
    const card = progress.cardProgress[q.id]
    if (!card || !card.lastReviewDate) {
      return { label: "Chưa học", color: "secondary", icon: Clock }
    }
    
    const now = new Date()
    const isDue = new Date(card.nextReviewDate) <= now
    
    if (card.easeFactor < 2.0) {
      return { label: "Rất yếu", color: "destructive", icon: XCircle }
    }
    if (card.easeFactor < 2.3 || card.repetitions < 2) {
      return { label: "Cần ôn thêm", color: "warning", icon: AlertTriangle }
    }
    if (isDue) {
      return { label: "Đến lúc ôn", color: "default", icon: RotateCcw }
    }
    return { label: "Đã thuộc", color: "success", icon: CheckCircle }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Lịch sử ôn tập</h1>
          <p className="text-sm text-muted-foreground">{questionSetTitle}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.reviewed}/{stats.total}</div>
            <p className="text-xs text-muted-foreground">Đã ôn tập</p>
            <Progress value={stats.progressPercent} className="mt-2 h-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.dueCount}</div>
            <p className="text-xs text-muted-foreground">Cần ôn hôm nay</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{stats.weakCount}</div>
            <p className="text-xs text-muted-foreground">Câu yếu</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{stats.strongCount}</div>
            <p className="text-xs text-muted-foreground">Đã thuộc</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {stats.dueCount > 0 && (
          <Button onClick={() => onReviewCards(categorizedQuestions.due.map((q) => q.id))}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Ôn {stats.dueCount} câu đến hạn
          </Button>
        )}
        {stats.weakCount > 0 && (
          <Button 
            variant="outline"
            onClick={() => onReviewCards(categorizedQuestions.weak.map((q) => q.id))}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Ôn {stats.weakCount} câu yếu
          </Button>
        )}
        {stats.newCount > 0 && (
          <Button 
            variant="outline"
            onClick={() => onReviewCards(categorizedQuestions.new.map((q) => q.id))}
          >
            <Brain className="h-4 w-4 mr-2" />
            Học {stats.newCount} câu mới
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Tất cả ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="weak">
            Yếu ({stats.weakCount})
          </TabsTrigger>
          <TabsTrigger value="strong">
            Thuộc ({stats.strongCount})
          </TabsTrigger>
          <TabsTrigger value="new">
            Mới ({stats.newCount})
          </TabsTrigger>
          <TabsTrigger value="bookmarked">
            <BookmarkCheck className="h-4 w-4 mr-1" />
            ({stats.bookmarkedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {displayedQuestions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Không có câu hỏi nào trong danh mục này
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayedQuestions.map((q) => {
                const status = getQuestionStatus(q)
                const card = progress.cardProgress[q.id]
                const isBookmarked = progress.bookmarkedQuestions.includes(q.id)
                const StatusIcon = status.icon

                return (
                  <Card key={q.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-2">{q.question}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge 
                              variant={status.color === "success" ? "default" : status.color === "warning" ? "secondary" : status.color as "default" | "secondary" | "destructive" | "outline"}
                              className="flex items-center gap-1"
                            >
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                            {q.topic && (
                              <Badge variant="outline">{q.topic}</Badge>
                            )}
                            {isBookmarked && (
                              <Badge variant="outline" className="text-yellow-500">
                                <BookmarkCheck className="h-3 w-3 mr-1" />
                                Đánh dấu
                              </Badge>
                            )}
                          </div>
                          {card?.lastReviewDate && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Ôn lần cuối: {formatDistanceToNow(new Date(card.lastReviewDate), { addSuffix: true, locale: vi })}
                              {" • "}
                              Ease: {card.easeFactor.toFixed(2)}
                              {" • "}
                              Lặp: {card.repetitions} lần
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onReviewCards([q.id])}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

