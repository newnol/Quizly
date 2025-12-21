"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Question } from "@/lib/questions"
import { cn } from "@/lib/utils"
import { RotateCcw, Bookmark, BookmarkCheck } from "lucide-react"
import type { Quality } from "@/lib/spaced-repetition"

interface FlashcardProps {
  question: Question
  isBookmarked: boolean
  onToggleBookmark: () => void
  onRate: (quality: Quality) => void
  questionNumber: number
  totalQuestions: number
}

const ratingOptions: { quality: Quality; label: string; color: string }[] = [
  { quality: 0, label: "Quên hoàn toàn", color: "text-red-600 border-red-200 hover:bg-red-50" },
  { quality: 1, label: "Sai, nhưng quen", color: "text-red-500 border-red-200 hover:bg-red-50" },
  { quality: 2, label: "Sai, dễ nhớ", color: "text-orange-500 border-orange-200 hover:bg-orange-50" },
  { quality: 3, label: "Đúng, khó", color: "text-yellow-600 border-yellow-200 hover:bg-yellow-50" },
  { quality: 4, label: "Đúng, hơi ngập ngừng", color: "text-green-500 border-green-200 hover:bg-green-50" },
  { quality: 5, label: "Nhớ hoàn hảo", color: "text-green-600 border-green-200 hover:bg-green-50" },
]

export function Flashcard({
  question,
  isBookmarked,
  onToggleBookmark,
  onRate,
  questionNumber,
  totalQuestions,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    setIsFlipped(false)
  }, [question.id])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline">{question.topic}</Badge>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {questionNumber}/{totalQuestions}
          </span>
          <Button variant="ghost" size="icon" onClick={onToggleBookmark}>
            {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="relative min-h-[300px] cursor-pointer perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
        <Card
          className={cn(
            "absolute inset-0 backface-hidden transition-transform duration-500",
            isFlipped && "rotate-y-180",
          )}
        >
          <CardContent className="flex items-center justify-center h-full min-h-[300px] p-6">
            <div className="text-center">
              <p className="text-lg font-medium leading-relaxed">{question.question}</p>
              <p className="text-sm text-muted-foreground mt-4">Nhấn để xem đáp án</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "absolute inset-0 backface-hidden transition-transform duration-500 rotate-y-180",
            isFlipped && "rotate-y-0",
          )}
        >
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] p-6">
            <div className="text-center space-y-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <p className="font-medium text-green-700 dark:text-green-400">
                  {question.options[question.correctAnswer]}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isFlipped && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-center text-muted-foreground">Bạn nhớ câu này như thế nào?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ratingOptions.map(({ quality, label, color }) => (
              <Button
                key={quality}
                variant="outline"
                size="sm"
                onClick={() => onRate(quality)}
                className={cn("text-xs h-auto py-2", color)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => setIsFlipped(false)} className="gap-1">
          <RotateCcw className="h-4 w-4" />
          Lật lại
        </Button>
      </div>
    </div>
  )
}
