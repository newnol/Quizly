"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QuestionEditor, QuestionCard, type QuestionFormData } from "@/components/question-editor"
import { ImportQuestionsDialog } from "@/components/import-questions-dialog"
import { createQuestionSet, createManyQuestions } from "@/lib/question-sets"
import { ArrowLeft, Globe, Link2, Lock, Plus, Save, Upload } from "lucide-react"
import Link from "next/link"

export default function NewSetPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">("private")
  const [questions, setQuestions] = useState<QuestionFormData[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showNewQuestion, setShowNewQuestion] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const newQuestionRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Use getUser() to properly validate the session with the server
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        setUser(currentUser)

        if (!currentUser) {
          router.push("/?login=true")
          return
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [supabase.auth, router])

  // Scroll to new question form when it opens
  useEffect(() => {
    if (showNewQuestion && newQuestionRef.current) {
      newQuestionRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [showNewQuestion])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = "Tên bộ câu hỏi không được để trống"
    }

    if (questions.length === 0) {
      newErrors.questions = "Cần ít nhất 1 câu hỏi"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!user || !validate()) return

    setSaving(true)
    try {
      // Create question set
      const questionSet = await createQuestionSet(user.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
      })

      if (!questionSet) {
        throw new Error("Failed to create question set")
      }

      // Create questions
      if (questions.length > 0) {
        const questionsToCreate = questions.map((q, index) => ({
          question: q.question,
          options: q.options,
          correct_answer: q.correctAnswer,
          explanation: q.explanation || undefined,
          topic: q.topic || undefined,
          order_index: index,
        }))

        await createManyQuestions(questionSet.id, questionsToCreate)
      }

      router.push(`/sets/${questionSet.id}`)
    } catch (error) {
      console.error("Error creating question set:", error)
      alert("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setSaving(false)
    }
  }

  const handleAddQuestion = (data: QuestionFormData) => {
    setQuestions([...questions, data])
    setShowNewQuestion(false)
  }

  const handleUpdateQuestion = (index: number, data: QuestionFormData) => {
    const newQuestions = [...questions]
    newQuestions[index] = data
    setQuestions(newQuestions)
    setEditingIndex(null)
  }

  const handleDeleteQuestion = (index: number) => {
    if (confirm("Bạn có chắc muốn xóa câu hỏi này?")) {
      setQuestions(questions.filter((_, i) => i !== index))
      if (editingIndex === index) {
        setEditingIndex(null)
      }
    }
  }

  const handleImportQuestions = (importedQuestions: QuestionFormData[]) => {
    setQuestions([...questions, ...importedQuestions])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Đang tải...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/my-sets">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Tạo bộ câu hỏi mới</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>Đặt tên và mô tả cho bộ câu hỏi của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tên bộ câu hỏi *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Ôn tập Mạng Máy Tính"
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về bộ câu hỏi..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Chế độ hiển thị</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Riêng tư - Chỉ bạn xem được
                  </div>
                </SelectItem>
                <SelectItem value="unlisted">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Có link - Ai có link đều xem được
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Công khai - Hiển thị trong trang khám phá
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Câu hỏi</h2>
            <p className="text-sm text-muted-foreground">{questions.length} câu hỏi</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportQuestionsDialog onImport={handleImportQuestions}>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportQuestionsDialog>
            {!showNewQuestion && (
              <Button onClick={() => setShowNewQuestion(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm câu hỏi
              </Button>
            )}
          </div>
        </div>

        {errors.questions && (
          <p className="text-sm text-destructive">{errors.questions}</p>
        )}

        {/* New question form - shown at top */}
        {showNewQuestion && (
          <div ref={newQuestionRef}>
            <QuestionEditor
              index={questions.length}
              onSave={handleAddQuestion}
              onCancel={() => setShowNewQuestion(false)}
              isNew
            />
          </div>
        )}

        {/* Question list */}
        <div className="space-y-3">
          {questions.map((q, index) =>
            editingIndex === index ? (
              <QuestionEditor
                key={index}
                question={q}
                index={index}
                onSave={(data) => handleUpdateQuestion(index, data)}
                onCancel={() => setEditingIndex(null)}
                onDelete={() => handleDeleteQuestion(index)}
              />
            ) : (
              <QuestionCard
                key={index}
                question={q}
                index={index}
                onEdit={() => setEditingIndex(index)}
                onDelete={() => handleDeleteQuestion(index)}
              />
            )
          )}
        </div>

        {/* Add question button at bottom */}
        {!showNewQuestion && questions.length > 0 && (
          <Button variant="outline" className="w-full" onClick={() => setShowNewQuestion(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm câu hỏi
          </Button>
        )}
      </div>
    </main>
  )
}

