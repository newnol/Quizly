"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Question } from "@/lib/questions"
import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, Bookmark, BookmarkCheck, MessageSquare } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface QuizCardProps {
  question: Question
  onAnswer: (isCorrect: boolean, timeTaken: number) => void
  showFeedback: boolean
  selectedAnswer: number | null
  isBookmarked: boolean
  onToggleBookmark: () => void
  note: string
  onSaveNote: (note: string) => void
  questionNumber: number
  totalQuestions: number
}

export function QuizCard({
  question,
  onAnswer,
  showFeedback,
  selectedAnswer,
  isBookmarked,
  onToggleBookmark,
  note,
  onSaveNote,
  questionNumber,
  totalQuestions,
}: QuizCardProps) {
  const [startTime] = useState(Date.now())
  const [localNote, setLocalNote] = useState(note)
  const [showNote, setShowNote] = useState(false)

  useEffect(() => {
    setLocalNote(note)
  }, [note])

  const handleSelect = (index: number) => {
    if (showFeedback) return
    const timeTaken = Date.now() - startTime
    onAnswer(index === question.correctAnswer, timeTaken)
  }

  const handleSaveNote = () => {
    onSaveNote(localNote)
    setShowNote(false)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {question.topic}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {questionNumber}/{totalQuestions}
            </span>
            <Button variant="ghost" size="icon" onClick={onToggleBookmark} className="h-8 w-8">
              {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowNote(!showNote)} className="h-8 w-8">
              <MessageSquare className={cn("h-4 w-4", note && "text-primary")} />
            </Button>
          </div>
        </div>
        <CardTitle className="text-lg leading-relaxed mt-2">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index
          const isCorrect = index === question.correctAnswer

          let variant: "outline" | "default" | "destructive" | "secondary" = "outline"
          if (showFeedback) {
            if (isCorrect) variant = "default"
            else if (isSelected) variant = "destructive"
          }

          return (
            <Button
              key={index}
              variant={variant}
              className={cn(
                "w-full justify-start text-left h-auto py-3 px-4 whitespace-normal",
                showFeedback && isCorrect && "bg-green-500 hover:bg-green-600 text-white",
                showFeedback && isSelected && !isCorrect && "bg-red-500 hover:bg-red-600 text-white",
              )}
              onClick={() => handleSelect(index)}
              disabled={showFeedback}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
              <span className="flex-1">{option}</span>
              {showFeedback && isCorrect && <CheckCircle className="h-5 w-5 ml-2 flex-shrink-0" />}
              {showFeedback && isSelected && !isCorrect && <XCircle className="h-5 w-5 ml-2 flex-shrink-0" />}
            </Button>
          )
        })}

        {showFeedback && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium text-sm mb-1">Giải thích:</p>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}

        {showNote && (
          <div className="mt-4 space-y-2">
            <Textarea
              placeholder="Thêm ghi chú cá nhân..."
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
              className="min-h-[80px]"
            />
            <Button size="sm" onClick={handleSaveNote}>
              Lưu ghi chú
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
