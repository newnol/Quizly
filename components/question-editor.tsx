"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, GripVertical, Plus, Trash2, X } from "lucide-react"

export interface QuestionFormData {
  id?: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  topic: string
}

interface QuestionEditorProps {
  question?: QuestionFormData
  index: number
  onSave: (data: QuestionFormData) => void
  onDelete?: () => void
  onCancel?: () => void
  isNew?: boolean
}

export function QuestionEditor({
  question,
  index,
  onSave,
  onDelete,
  onCancel,
  isNew = false,
}: QuestionEditorProps) {
  const [formData, setFormData] = useState<QuestionFormData>(
    question || {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      topic: "",
    }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.question.trim()) {
      newErrors.question = "Câu hỏi không được để trống"
    }

    const filledOptions = formData.options.filter((o) => o.trim())
    if (filledOptions.length < 2) {
      newErrors.options = "Cần ít nhất 2 đáp án"
    }

    if (formData.correctAnswer < 0 || formData.correctAnswer >= formData.options.length) {
      newErrors.correctAnswer = "Chọn đáp án đúng"
    }

    if (!formData.options[formData.correctAnswer]?.trim()) {
      newErrors.correctAnswer = "Đáp án đúng không được để trống"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validate()) {
      // Filter out empty options but keep the correct answer index valid
      const filledOptions: string[] = []
      let newCorrectAnswer = -1

      formData.options.forEach((opt, i) => {
        if (opt.trim()) {
          if (i === formData.correctAnswer) {
            newCorrectAnswer = filledOptions.length
          }
          filledOptions.push(opt.trim())
        }
      })

      onSave({
        ...formData,
        question: formData.question.trim(),
        options: filledOptions,
        correctAnswer: newCorrectAnswer,
        explanation: formData.explanation.trim(),
        topic: formData.topic.trim(),
      })
    }
  }

  const handleOptionChange = (optionIndex: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[optionIndex] = value
    setFormData({ ...formData, options: newOptions })
  }

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({ ...formData, options: [...formData.options, ""] })
    }
  }

  const removeOption = (optionIndex: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== optionIndex)
      let newCorrectAnswer = formData.correctAnswer
      if (optionIndex === formData.correctAnswer) {
        newCorrectAnswer = 0
      } else if (optionIndex < formData.correctAnswer) {
        newCorrectAnswer = formData.correctAnswer - 1
      }
      setFormData({ ...formData, options: newOptions, correctAnswer: newCorrectAnswer })
    }
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            Câu {index + 1}
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isNew && onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question */}
        <div className="space-y-2">
          <Label htmlFor={`question-${index}`}>Câu hỏi *</Label>
          <Textarea
            id={`question-${index}`}
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            placeholder="Nhập câu hỏi..."
            rows={2}
          />
          {errors.question && (
            <p className="text-sm text-destructive">{errors.question}</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2">
          <Label>Đáp án * (click để chọn đáp án đúng)</Label>
          <div className="space-y-2">
            {formData.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={formData.correctAnswer === optionIndex ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setFormData({ ...formData, correctAnswer: optionIndex })}
                >
                  {formData.correctAnswer === optionIndex ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs">{String.fromCharCode(65 + optionIndex)}</span>
                  )}
                </Button>
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                  placeholder={`Đáp án ${String.fromCharCode(65 + optionIndex)}`}
                  className={formData.correctAnswer === optionIndex ? "border-primary" : ""}
                />
                {formData.options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeOption(optionIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {formData.options.length < 6 && (
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4 mr-1" />
              Thêm đáp án
            </Button>
          )}
          {errors.options && <p className="text-sm text-destructive">{errors.options}</p>}
          {errors.correctAnswer && (
            <p className="text-sm text-destructive">{errors.correctAnswer}</p>
          )}
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <Label htmlFor={`topic-${index}`}>Chủ đề</Label>
          <Input
            id={`topic-${index}`}
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="VD: Mạng máy tính, Lập trình..."
          />
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <Label htmlFor={`explanation-${index}`}>Giải thích</Label>
          <Textarea
            id={`explanation-${index}`}
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            placeholder="Giải thích tại sao đáp án này đúng..."
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
          )}
          <Button type="button" onClick={handleSave}>
            {isNew ? "Thêm câu hỏi" : "Lưu"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Display-only question card for list view
interface QuestionCardProps {
  question: QuestionFormData
  index: number
  onEdit: () => void
  onDelete: () => void
}

export function QuestionCard({ question, index, onEdit, onDelete }: QuestionCardProps) {
  return (
    <Card className="group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center">
              {index + 1}
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium line-clamp-2">{question.question}</p>
            <div className="flex items-center gap-2 mt-2">
              {question.topic && (
                <Badge variant="secondary" className="text-xs">
                  {question.topic}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {question.options.length} đáp án
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Sửa
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

