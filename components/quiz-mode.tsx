"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { QuizCard } from "./quiz-card"
import { questions, topics, type Question } from "@/lib/questions"
import { type UserProgress, updateStreak, type StudySession } from "@/lib/storage"
import { calculateNextReview, qualityFromAnswer } from "@/lib/spaced-repetition"
import { ArrowLeft, ArrowRight, Shuffle, Clock, RotateCcw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

interface QuizModeProps {
  progress: UserProgress
  setProgress: (progress: UserProgress) => void
  onBack: () => void
}

type FilterType = "all" | "bookmarked" | "wrong" | "new" | "due"

export function QuizMode({ progress, setProgress, onBack }: QuizModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([])
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<FilterType>("all")
  const [timedMode, setTimedMode] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })
  const [isStarted, setIsStarted] = useState(false)

  const filterQuestions = useCallback(() => {
    let filtered = [...questions]

    if (topicFilter !== "all") {
      filtered = filtered.filter((q) => q.topic === topicFilter)
    }

    switch (statusFilter) {
      case "bookmarked":
        filtered = filtered.filter((q) => progress.bookmarkedQuestions.includes(q.id))
        break
      case "wrong":
        filtered = filtered.filter((q) => progress.wrongAnswers.includes(q.id))
        break
      case "new":
        filtered = filtered.filter((q) => !progress.cardProgress[q.id])
        break
      case "due":
        const now = new Date()
        filtered = filtered.filter((q) => {
          const card = progress.cardProgress[q.id]
          if (!card) return true
          return new Date(card.nextReviewDate) <= now
        })
        break
    }

    // Shuffle
    return filtered.sort(() => Math.random() - 0.5)
  }, [topicFilter, statusFilter, progress])

  useEffect(() => {
    if (!isStarted) return
    setShuffledQuestions(filterQuestions())
    setCurrentIndex(0)
    setShowFeedback(false)
    setSelectedAnswer(null)
  }, [filterQuestions, isStarted])

  // Timer effect
  useEffect(() => {
    if (!timedMode || showFeedback || !isStarted) return

    setTimeLeft(30)
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswer(false, 30000) // Time's up = wrong
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentIndex, timedMode, showFeedback, isStarted])

  const currentQuestion = shuffledQuestions[currentIndex]

  const handleAnswer = (isCorrect: boolean, timeTaken: number) => {
    setSelectedAnswer(
      isCorrect
        ? currentQuestion.correctAnswer
        : currentQuestion.options.findIndex((_, i) => i !== currentQuestion.correctAnswer),
    )
    setShowFeedback(true)

    const quality = qualityFromAnswer(isCorrect, timeTaken)
    const currentCard = progress.cardProgress[currentQuestion.id] || {
      questionId: currentQuestion.id,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: new Date(),
      lastReviewDate: null,
    }

    const updatedCard = calculateNextReview(quality, currentCard)

    const newWrongAnswers = isCorrect
      ? progress.wrongAnswers.filter((id) => id !== currentQuestion.id)
      : [...new Set([...progress.wrongAnswers, currentQuestion.id])]

    const updatedProgress = updateStreak({
      ...progress,
      cardProgress: {
        ...progress.cardProgress,
        [currentQuestion.id]: updatedCard,
      },
      wrongAnswers: newWrongAnswers,
    })

    setProgress(updatedProgress)

    setSessionStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }))
  }

  const handleNext = () => {
    if (currentIndex < shuffledQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setShowFeedback(false)
      setSelectedAnswer(null)
    } else {
      // End of quiz
      const session: StudySession = {
        date: new Date(),
        questionsAnswered: sessionStats.total,
        correctAnswers: sessionStats.correct,
        mode: "quiz",
      }
      const updatedProgress = {
        ...progress,
        studySessions: [...progress.studySessions, session],
      }
      setProgress(updatedProgress)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setShowFeedback(false)
      setSelectedAnswer(null)
    }
  }

  const toggleBookmark = () => {
    const isBookmarked = progress.bookmarkedQuestions.includes(currentQuestion.id)
    const updatedProgress = {
      ...progress,
      bookmarkedQuestions: isBookmarked
        ? progress.bookmarkedQuestions.filter((id) => id !== currentQuestion.id)
        : [...progress.bookmarkedQuestions, currentQuestion.id],
    }
    setProgress(updatedProgress)
  }

  const saveNote = (note: string) => {
    const updatedProgress = {
      ...progress,
      notes: {
        ...progress.notes,
        [currentQuestion.id]: note,
      },
    }
    setProgress(updatedProgress)
  }

  const startQuiz = () => {
    setIsStarted(true)
    setSessionStats({ correct: 0, total: 0 })
  }

  if (!isStarted) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <h2 className="text-2xl font-bold">Cài đặt Quiz</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Chủ đề</Label>
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn chủ đề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chủ đề</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Lọc theo trạng thái</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterType)}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc câu hỏi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="new">Chưa làm</SelectItem>
                <SelectItem value="due">Cần ôn tập</SelectItem>
                <SelectItem value="wrong">Đã sai</SelectItem>
                <SelectItem value="bookmarked">Đã đánh dấu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="timed" checked={timedMode} onCheckedChange={setTimedMode} />
            <Label htmlFor="timed" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Chế độ giới hạn thời gian (30 giây/câu)
            </Label>
          </div>
        </div>

        <Button onClick={startQuiz} size="lg" className="w-full">
          <Shuffle className="h-4 w-4 mr-2" />
          Bắt đầu Quiz
        </Button>
      </div>
    )
  }

  if (shuffledQuestions.length === 0) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Không có câu hỏi nào phù hợp với bộ lọc.</p>
        <Button onClick={() => setIsStarted(false)}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Đổi bộ lọc
        </Button>
      </div>
    )
  }

  if (currentIndex >= shuffledQuestions.length) {
    return (
      <div className="text-center space-y-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold">Hoàn thành!</h2>
        <div className="p-6 bg-muted rounded-lg space-y-2">
          <p className="text-4xl font-bold text-primary">
            {Math.round((sessionStats.correct / sessionStats.total) * 100)}%
          </p>
          <p className="text-muted-foreground">
            {sessionStats.correct}/{sessionStats.total} câu đúng
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Trang chủ
          </Button>
          <Button
            onClick={() => {
              setIsStarted(false)
              setCurrentIndex(0)
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Làm lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Thoát
        </Button>
        <div className="flex items-center gap-4">
          {timedMode && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className={timeLeft < 10 ? "text-red-500 font-bold" : ""}>{timeLeft}s</span>
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            Đúng: {sessionStats.correct}/{sessionStats.total}
          </span>
        </div>
      </div>

      <Progress value={(currentIndex / shuffledQuestions.length) * 100} className="h-2" />

      <QuizCard
        question={currentQuestion}
        onAnswer={handleAnswer}
        showFeedback={showFeedback}
        selectedAnswer={selectedAnswer}
        isBookmarked={progress.bookmarkedQuestions.includes(currentQuestion.id)}
        onToggleBookmark={toggleBookmark}
        note={progress.notes[currentQuestion.id] || ""}
        onSaveNote={saveNote}
        questionNumber={currentIndex + 1}
        totalQuestions={shuffledQuestions.length}
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Trước
        </Button>
        <Button onClick={handleNext} disabled={!showFeedback}>
          {currentIndex === shuffledQuestions.length - 1 ? "Kết thúc" : "Tiếp"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
