"use client"

import { useState, useEffect, use, useRef } from "react"
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
import {
  getQuestionSetById,
  getQuestionsBySetId,
  updateQuestionSet,
  createQuestion,
  createManyQuestions,
  updateQuestion,
  deleteQuestion,
  type QuestionSet,
} from "@/lib/question-sets"
import { ArrowLeft, Globe, Link2, Lock, Plus, Save, Upload } from "lucide-react"
import Link from "next/link"

export default function EditSetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">("private")
  const [questions, setQuestions] = useState<(QuestionFormData & { dbId?: string })[]>([])
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

        // Load question set
        const set = await getQuestionSetById(id)
        if (!set) {
          router.push("/my-sets")
          return
        }

        // Check ownership
        if (set.owner_id !== currentUser.id) {
          router.push(`/sets/${id}`)
          return
        }

        setQuestionSet(set)
        setTitle(set.title)
        setDescription(set.description || "")
        setVisibility(set.visibility)

        // Load questions
        const dbQuestions = await getQuestionsBySetId(id)
        setQuestions(
          dbQuestions.map((q) => ({
            id: q.id,
            dbId: q.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correct_answer,
            explanation: q.explanation || "",
            topic: q.topic || "",
          }))
        )
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [supabase.auth, router, id])

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
    if (!user || !questionSet || !validate()) return

    setSaving(true)
    try {
      // Update question set
      await updateQuestionSet(questionSet.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
      })

      router.push(`/sets/${questionSet.id}`)
    } catch (error) {
      console.error("Error updating question set:", error)
      alert("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setSaving(false)
    }
  }

  const handleAddQuestion = async (data: QuestionFormData) => {
    if (!questionSet) return

    try {
      const newQuestion = await createQuestion(questionSet.id, {
        question: data.question,
        options: data.options,
        correct_answer: data.correctAnswer,
        explanation: data.explanation || undefined,
        topic: data.topic || undefined,
        order_index: questions.length,
      })

      if (newQuestion) {
        setQuestions([
          ...questions,
          {
            ...data,
            dbId: newQuestion.id,
          },
        ])
      }
      setShowNewQuestion(false)
    } catch (error) {
      console.error("Error adding question:", error)
      alert("Có lỗi xảy ra. Vui lòng thử lại.")
    }
  }

  const handleUpdateQuestion = async (index: number, data: QuestionFormData) => {
    const existingQuestion = questions[index]
    if (!existingQuestion?.dbId) return

    try {
      await updateQuestion(existingQuestion.dbId, {
        question: data.question,
        options: data.options,
        correct_answer: data.correctAnswer,
        explanation: data.explanation || undefined,
        topic: data.topic || undefined,
      })

      const newQuestions = [...questions]
      newQuestions[index] = { ...data, dbId: existingQuestion.dbId }
      setQuestions(newQuestions)
      setEditingIndex(null)
    } catch (error) {
      console.error("Error updating question:", error)
      alert("Có lỗi xảy ra. Vui lòng thử lại.")
    }
  }

  const handleDeleteQuestion = async (index: number) => {
    const existingQuestion = questions[index]
    if (!existingQuestion?.dbId) return

    if (!confirm("Bạn có chắc muốn xóa câu hỏi này?")) return

    try {
      await deleteQuestion(existingQuestion.dbId)
      setQuestions(questions.filter((_, i) => i !== index))
      if (editingIndex === index) {
        setEditingIndex(null)
      }
    } catch (error) {
      console.error("Error deleting question:", error)
      alert("Có lỗi xảy ra. Vui lòng thử lại.")
    }
  }

  const handleImportQuestions = async (importedQuestions: QuestionFormData[]) => {
    if (!questionSet) return

    try {
      const questionsToCreate = importedQuestions.map((q, index) => ({
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation || undefined,
        topic: q.topic || undefined,
        order_index: questions.length + index,
      }))

      const newQuestions = await createManyQuestions(questionSet.id, questionsToCreate)
      
      setQuestions([
        ...questions,
        ...newQuestions.map((nq) => ({
          question: nq.question,
          options: nq.options,
          correctAnswer: nq.correct_answer,
          explanation: nq.explanation || "",
          topic: nq.topic || "",
          dbId: nq.id,
        })),
      ])
    } catch (error) {
      console.error("Error importing questions:", error)
      alert("Có lỗi xảy ra khi import. Vui lòng thử lại.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Đang tải...</div>
      </div>
    )
  }

  if (!user || !questionSet) {
    return null
  }

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/sets/${questionSet.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Chỉnh sửa bộ câu hỏi</h1>
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
          <CardDescription>Cập nhật thông tin bộ câu hỏi</CardDescription>
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
                key={q.dbId || index}
                question={q}
                index={index}
                onSave={(data) => handleUpdateQuestion(index, data)}
                onCancel={() => setEditingIndex(null)}
                onDelete={() => handleDeleteQuestion(index)}
              />
            ) : (
              <QuestionCard
                key={q.dbId || index}
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

