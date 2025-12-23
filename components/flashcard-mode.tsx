"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Flashcard } from "./flashcard"
import { questions as defaultQuestions, topics as defaultTopics, fetchQuestions, getTopicsFromQuestions, type Question } from "@/lib/questions"
import { type UserProgress, updateStreak, type StudySession } from "@/lib/storage"
import { calculateNextReview, type Quality } from "@/lib/spaced-repetition"
import { ArrowLeft, ArrowRight, Shuffle, RotateCcw, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

interface FlashcardModeProps {
  progress: UserProgress
  setProgress: (progress: UserProgress) => void
  onBack: () => void
  specificQuestionIds?: string[] | null
  questionSetId?: string
  onAskAI?: (question: Question) => void
}

type FilterType = "all" | "bookmarked" | "due" | "weak"

export function FlashcardMode({ progress, setProgress, onBack, specificQuestionIds, questionSetId, onAskAI }: FlashcardModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([])
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<FilterType>("due")
  const [isStarted, setIsStarted] = useState(!!specificQuestionIds)
  const [reviewed, setReviewed] = useState(0)
  const reviewedInSession = useRef<Set<string>>(new Set())
  const [allQuestions, setAllQuestions] = useState<Question[]>(defaultQuestions)
  const [topics, setTopics] = useState<string[]>(defaultTopics)
  const [loadingQuestions, setLoadingQuestions] = useState(!!questionSetId)

  // Load questions from database if questionSetId is provided
  useEffect(() => {
    const loadQuestions = async () => {
      if (questionSetId) {
        setLoadingQuestions(true)
        try {
          const questions = await fetchQuestions(questionSetId)
          setAllQuestions(questions)
          setTopics(getTopicsFromQuestions(questions))
        } catch (error) {
          console.error("Error loading questions:", error)
        } finally {
          setLoadingQuestions(false)
        }
      } else {
        setAllQuestions(defaultQuestions)
        setTopics(defaultTopics)
      }
    }
    loadQuestions()
  }, [questionSetId])

  const filterQuestions = useCallback(() => {
    if (specificQuestionIds && specificQuestionIds.length > 0) {
      const specificQuestions = allQuestions.filter((q) => specificQuestionIds.includes(q.id))
      return specificQuestions.sort(() => Math.random() - 0.5)
    }

    let filtered = [...allQuestions]

    if (topicFilter !== "all") {
      filtered = filtered.filter((q) => q.topic === topicFilter)
    }

    const now = new Date()

    switch (statusFilter) {
      case "bookmarked":
        filtered = filtered.filter((q) => progress.bookmarkedQuestions.includes(q.id))
        break
      case "due":
        filtered = filtered.filter((q) => {
          if (reviewedInSession.current.has(q.id)) return false
          const card = progress.cardProgress[q.id]
          if (!card) return true
          return new Date(card.nextReviewDate) <= now
        })
        break
      case "weak":
        filtered = filtered.filter((q) => {
          if (reviewedInSession.current.has(q.id)) return false
          const card = progress.cardProgress[q.id]
          if (!card) return true
          return card.easeFactor < 2.3 || card.repetitions < 2
        })
        break
    }

    return filtered.sort(() => Math.random() - 0.5)
  }, [topicFilter, statusFilter, progress, specificQuestionIds, allQuestions])

  useEffect(() => {
    if (!isStarted) return
    reviewedInSession.current = new Set()
    setShuffledQuestions(filterQuestions())
    setCurrentIndex(0)
    setReviewed(0)
  }, [isStarted]) // Remove filterQuestions from deps to avoid constant re-filtering

  const currentQuestion = shuffledQuestions[currentIndex]

  const handleRate = (quality: Quality) => {
    const currentCard = progress.cardProgress[currentQuestion.id] || {
      questionId: currentQuestion.id,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: new Date(),
      lastReviewDate: null,
    }

    const updatedCard = calculateNextReview(quality, currentCard)

    const updatedProgress = updateStreak({
      ...progress,
      cardProgress: {
        ...progress.cardProgress,
        [currentQuestion.id]: updatedCard,
      },
    })

    setProgress(updatedProgress)
    setReviewed((prev) => prev + 1)

    reviewedInSession.current.add(currentQuestion.id)

    if (currentIndex < shuffledQuestions.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
      }, 300)
    } else {
      // Show completion screen
      setTimeout(() => {
        setCurrentIndex(shuffledQuestions.length)
      }, 300)
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

  const handleNext = () => {
    if (currentIndex < shuffledQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleRandom = () => {
    const newIndex = Math.floor(Math.random() * shuffledQuestions.length)
    setCurrentIndex(newIndex)
  }

  const startFlashcards = () => {
    reviewedInSession.current = new Set()
    setIsStarted(true)
  }

  const finishSession = () => {
    const session: StudySession = {
      date: new Date(),
      questionsAnswered: reviewed,
      correctAnswers: reviewed,
      mode: "flashcard",
    }
    const updatedProgress = {
      ...progress,
      studySessions: [...progress.studySessions, session],
    }
    setProgress(updatedProgress)
    onBack()
  }

  if (loadingQuestions) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isStarted && !specificQuestionIds) {
    const now = new Date()
    const dueCount = allQuestions.filter((q) => {
      const card = progress.cardProgress[q.id]
      if (!card) return true
      return new Date(card.nextReviewDate) <= now
    }).length

    const weakCount = allQuestions.filter((q) => {
      const card = progress.cardProgress[q.id]
      if (!card) return true
      return card.easeFactor < 2.3 || card.repetitions < 2
    }).length

    const bookmarkedCount = progress.bookmarkedQuestions.length

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <h2 className="text-2xl font-bold">Flashcard</h2>

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
                <SelectItem value="all">Tất cả ({allQuestions.length})</SelectItem>
                <SelectItem value="due">Cần ôn tập ({dueCount})</SelectItem>
                <SelectItem value="weak">Câu yếu ({weakCount})</SelectItem>
                <SelectItem value="bookmarked">Đã đánh dấu ({bookmarkedCount})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={startFlashcards} size="lg" className="w-full">
          <Shuffle className="h-4 w-4 mr-2" />
          Bắt đầu
        </Button>
      </div>
    )
  }

  if (shuffledQuestions.length === 0) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Không có thẻ nào phù hợp với bộ lọc.</p>
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
          <p className="text-4xl font-bold text-primary">{reviewed}</p>
          <p className="text-muted-foreground">thẻ đã ôn tập</p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={finishSession} variant="outline">
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
        <Button variant="ghost" onClick={finishSession}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Thoát
        </Button>
        <span className="text-sm text-muted-foreground">Đã ôn: {reviewed}</span>
      </div>

      <Progress value={(currentIndex / shuffledQuestions.length) * 100} className="h-2" />

      <Flashcard
        question={currentQuestion}
        isBookmarked={progress.bookmarkedQuestions.includes(currentQuestion.id)}
        onToggleBookmark={toggleBookmark}
        onRate={handleRate}
        questionNumber={currentIndex + 1}
        totalQuestions={shuffledQuestions.length}
        onAskAI={onAskAI}
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Trước
        </Button>
        <Button variant="outline" onClick={handleRandom}>
          <Shuffle className="h-4 w-4 mr-2" />
          Ngẫu nhiên
        </Button>
        <Button variant="outline" onClick={handleNext} disabled={currentIndex === shuffledQuestions.length - 1}>
          Tiếp
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
