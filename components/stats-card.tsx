"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserProgress } from "@/lib/storage"
import { questions } from "@/lib/questions"
import { Flame, Target, BookOpen, TrendingUp, CheckCircle } from "lucide-react"

interface StatsCardProps {
  progress: UserProgress
}

export function StatsCard({ progress }: StatsCardProps) {
  const totalQuestions = questions.length
  const answeredQuestions = Object.keys(progress.cardProgress).length
  const correctRate =
    progress.studySessions.length > 0
      ? Math.round(
          (progress.studySessions.reduce((acc, s) => acc + s.correctAnswers, 0) /
            progress.studySessions.reduce((acc, s) => acc + s.questionsAnswered, 0)) *
            100,
        )
      : 0

  const dueToday = questions.filter((q) => {
    const card = progress.cardProgress[q.id]
    if (!card) return true
    return new Date(card.nextReviewDate) <= new Date()
  }).length

  const masteredCount = Object.values(progress.cardProgress).filter(
    (card) => card.easeFactor >= 2.5 && card.repetitions >= 3,
  ).length

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{progress.streak} ngày</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            Tỉ lệ đúng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{correctRate}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-green-500" />
            Đã học
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {answeredQuestions}/{totalQuestions}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            Đã ổn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{masteredCount}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            Cần ôn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{dueToday}</p>
        </CardContent>
      </Card>
    </div>
  )
}
