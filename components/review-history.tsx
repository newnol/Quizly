"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { questions, type Question } from "@/lib/questions"
import type { UserProgress } from "@/lib/storage"
import type { CardProgress } from "@/lib/spaced-repetition"
import { ArrowLeft, Clock, Calendar, RotateCcw, ChevronDown, ChevronUp, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReviewHistoryProps {
  progress: UserProgress
  onBack: () => void
  onReviewCards: (questionIds: string[]) => void
}

type MemoryLevel = "forgotten" | "weak" | "moderate" | "strong" | "mastered"

interface CardWithProgress {
  question: Question
  cardProgress: CardProgress
  memoryLevel: MemoryLevel
}

function getMemoryLevel(card: CardProgress): MemoryLevel {
  // Based on ease factor and repetitions
  if (card.easeFactor < 1.5 || card.repetitions === 0) return "forgotten"
  if (card.easeFactor < 2.0 || card.repetitions < 2) return "weak"
  if (card.easeFactor < 2.3 || card.repetitions < 4) return "moderate"
  if (card.easeFactor < 2.7) return "strong"
  return "mastered"
}

const memoryLevelConfig = {
  forgotten: { label: "Quên", color: "bg-red-500", textColor: "text-red-600", description: "Cần ôn ngay" },
  weak: { label: "Yếu", color: "bg-orange-500", textColor: "text-orange-600", description: "Cần ôn thường xuyên" },
  moderate: { label: "Trung bình", color: "bg-yellow-500", textColor: "text-yellow-600", description: "Đang tiến bộ" },
  strong: { label: "Khá", color: "bg-green-500", textColor: "text-green-600", description: "Gần thuộc" },
  mastered: { label: "Thuộc", color: "bg-emerald-500", textColor: "text-emerald-600", description: "Đã thành thạo" },
}

function formatDate(date: Date | null): string {
  if (!date) return "Chưa học"
  const d = new Date(date)
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function formatNextReview(date: Date): string {
  const now = new Date()
  const reviewDate = new Date(date)
  const diffDays = Math.ceil((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return "Hôm nay"
  if (diffDays === 1) return "Ngày mai"
  return `${diffDays} ngày nữa`
}

export function ReviewHistory({ progress, onBack, onReviewCards }: ReviewHistoryProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const cardsWithProgress = useMemo(() => {
    const cards: CardWithProgress[] = []

    for (const [questionId, cardProgress] of Object.entries(progress.cardProgress)) {
      const question = questions.find((q) => q.id === questionId)
      if (question && cardProgress.lastReviewDate) {
        cards.push({
          question,
          cardProgress,
          memoryLevel: getMemoryLevel(cardProgress),
        })
      }
    }

    // Sort by last review date (most recent first)
    cards.sort((a, b) => {
      const dateA = new Date(a.cardProgress.lastReviewDate!).getTime()
      const dateB = new Date(b.cardProgress.lastReviewDate!).getTime()
      return dateB - dateA
    })

    return cards
  }, [progress.cardProgress])

  const cardsByLevel = useMemo(() => {
    const grouped: Record<MemoryLevel, CardWithProgress[]> = {
      forgotten: [],
      weak: [],
      moderate: [],
      strong: [],
      mastered: [],
    }

    cardsWithProgress.forEach((card) => {
      grouped[card.memoryLevel].push(card)
    })

    return grouped
  }, [cardsWithProgress])

  const dueCards = useMemo(() => {
    const now = new Date()
    return cardsWithProgress.filter((card) => new Date(card.cardProgress.nextReviewDate) <= now)
  }, [cardsWithProgress])

  const renderCardItem = (card: CardWithProgress) => {
    const isExpanded = expandedCard === card.question.id
    const config = memoryLevelConfig[card.memoryLevel]

    return (
      <Card key={card.question.id} className="overflow-hidden">
        <CardHeader
          className="cursor-pointer py-3"
          onClick={() => setExpandedCard(isExpanded ? null : card.question.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{card.question.question}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {card.question.topic}
                </Badge>
                <Badge className={cn("text-xs", config.color)}>{config.label}</Badge>
              </div>
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0 space-y-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                {card.question.options[card.question.correctAnswer]}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{card.question.explanation}</p>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Học lần cuối: {formatDate(card.cardProgress.lastReviewDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Ôn tiếp: {formatNextReview(card.cardProgress.nextReviewDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                <span>Số lần ôn: {card.cardProgress.repetitions}</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                <span>Độ dễ: {card.cardProgress.easeFactor.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  const renderLevelTab = (level: MemoryLevel) => {
    const cards = cardsByLevel[level]
    const config = memoryLevelConfig[level]

    if (cards.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Không có thẻ nào ở mức này</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{config.description}</p>
          <Button size="sm" onClick={() => onReviewCards(cards.map((c) => c.question.id))}>
            Ôn tập {cards.length} thẻ
          </Button>
        </div>
        <div className="space-y-2">{cards.map(renderCardItem)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Lịch sử ôn tập</h2>
        <p className="text-muted-foreground">Xem lại các thẻ đã học và mức độ ghi nhớ</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {(Object.keys(memoryLevelConfig) as MemoryLevel[]).map((level) => {
          const config = memoryLevelConfig[level]
          const count = cardsByLevel[level].length
          return (
            <Card key={level} className="text-center">
              <CardContent className="p-3">
                <div className={cn("text-2xl font-bold", config.textColor)}>{count}</div>
                <div className="text-xs text-muted-foreground">{config.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Due Cards Alert */}
      {dueCards.length > 0 && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Cần ôn tập hôm nay
            </CardTitle>
            <CardDescription>Có {dueCards.length} thẻ đến hạn ôn tập</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onReviewCards(dueCards.map((c) => c.question.id))} className="w-full">
              Ôn tập ngay
            </Button>
          </CardContent>
        </Card>
      )}

      {cardsWithProgress.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Bạn chưa học thẻ nào.</p>
            <p className="text-sm mt-1">Hãy bắt đầu với chế độ Flashcard!</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="forgotten" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {(Object.keys(memoryLevelConfig) as MemoryLevel[]).map((level) => {
              const config = memoryLevelConfig[level]
              const count = cardsByLevel[level].length
              return (
                <TabsTrigger key={level} value={level} className="text-xs px-1">
                  {config.label} ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>

          {(Object.keys(memoryLevelConfig) as MemoryLevel[]).map((level) => (
            <TabsContent key={level} value={level} className="mt-4">
              {renderLevelTab(level)}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
