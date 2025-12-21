"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { questions, topics } from "@/lib/questions"
import type { UserProgress } from "@/lib/storage"
import { Search, ArrowLeft, BookmarkCheck, CheckCircle, XCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface SearchQuestionsProps {
  progress: UserProgress
  onBack: () => void
}

export function SearchQuestions({ progress, onBack }: SearchQuestionsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        searchTerm === "" ||
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.options.some((o) => o.toLowerCase().includes(searchTerm.toLowerCase())) ||
        q.explanation.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesTopic = topicFilter === "all" || q.topic === topicFilter

      let matchesStatus = true
      if (statusFilter === "bookmarked") {
        matchesStatus = progress.bookmarkedQuestions.includes(q.id)
      } else if (statusFilter === "wrong") {
        matchesStatus = progress.wrongAnswers.includes(q.id)
      } else if (statusFilter === "new") {
        matchesStatus = !progress.cardProgress[q.id]
      } else if (statusFilter === "learned") {
        const card = progress.cardProgress[q.id]
        matchesStatus = card && card.repetitions > 0
      }

      return matchesSearch && matchesTopic && matchesStatus
    })
  }, [searchTerm, topicFilter, statusFilter, progress])

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </Button>

      <h2 className="text-2xl font-bold">Tìm kiếm câu hỏi</h2>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm câu hỏi, đáp án, giải thích..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Chủ đề" />
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="new">Chưa làm</SelectItem>
            <SelectItem value="learned">Đã học</SelectItem>
            <SelectItem value="wrong">Đã sai</SelectItem>
            <SelectItem value="bookmarked">Đã đánh dấu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">Tìm thấy {filteredQuestions.length} câu hỏi</p>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {filteredQuestions.map((q, index) => {
          const isBookmarked = progress.bookmarkedQuestions.includes(q.id)
          const isWrong = progress.wrongAnswers.includes(q.id)
          const isLearned = progress.cardProgress[q.id]?.repetitions > 0
          const isExpanded = expandedId === q.id

          return (
            <Card
              key={q.id}
              className={cn("cursor-pointer transition-all", isExpanded && "ring-2 ring-primary")}
              onClick={() => setExpandedId(isExpanded ? null : q.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium leading-relaxed">
                    <span className="text-muted-foreground mr-2">#{index + 1}</span>
                    {q.question}
                  </CardTitle>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isBookmarked && <BookmarkCheck className="h-4 w-4 text-primary" />}
                    {isWrong && <XCircle className="h-4 w-4 text-red-500" />}
                    {isLearned && !isWrong && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                <Badge variant="outline" className="w-fit text-xs">
                  {q.topic}
                </Badge>
              </CardHeader>
              {isExpanded && (
                <CardContent className="pt-0 space-y-3">
                  <div className="space-y-2">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-2 rounded text-sm",
                          i === q.correctAnswer ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-muted",
                        )}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                        {i === q.correctAnswer && <CheckCircle className="inline h-4 w-4 ml-2" />}
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Giải thích:</p>
                    <p className="text-sm">{q.explanation}</p>
                  </div>
                  {progress.notes[q.id] && (
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <p className="text-xs font-medium text-primary mb-1">Ghi chú của bạn:</p>
                      <p className="text-sm">{progress.notes[q.id]}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
