"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  AlertCircle, 
  Check, 
  Copy,
  Loader2,
  Sparkles,
  Eye,
} from "lucide-react"
import type { QuestionFormData } from "./question-editor"

interface ImportQuestionsDialogProps {
  onImport: (questions: QuestionFormData[]) => void
  children?: React.ReactNode
}

interface ParseResult {
  questions: QuestionFormData[]
  errors: string[]
}

type FormatType = "json" | "csv" | "text" | "pdf"

const JSON_EXAMPLE = `[
  {
    "question": "Câu hỏi 1?",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correctAnswer": 0,
    "explanation": "Giải thích (tùy chọn)",
    "topic": "Chủ đề (tùy chọn)"
  },
  {
    "question": "Câu hỏi 2?",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C"],
    "correctAnswer": 1
  }
]`

const CSV_EXAMPLE = `question,optionA,optionB,optionC,optionD,correctAnswer,explanation,topic
"Câu hỏi 1?","Đáp án A","Đáp án B","Đáp án C","Đáp án D",0,"Giải thích","Chủ đề"
"Câu hỏi 2?","Đáp án A","Đáp án B","Đáp án C",,1,,`

const TEXT_EXAMPLE = `Q: Câu hỏi 1?
A: Đáp án A
B: Đáp án B
C: Đáp án C
D: Đáp án D
Answer: A
Explanation: Giải thích (tùy chọn)
Topic: Chủ đề (tùy chọn)

Q: Câu hỏi 2?
A: Đáp án A
B: Đáp án B
C: Đáp án C
Answer: B`

function parseJSON(content: string): ParseResult {
  const questions: QuestionFormData[] = []
  const errors: string[] = []

  try {
    const data = JSON.parse(content)
    
    if (!Array.isArray(data)) {
      return { questions: [], errors: ["Dữ liệu phải là một mảng JSON"] }
    }

    data.forEach((item, index) => {
      const lineNum = index + 1

      if (!item.question || typeof item.question !== "string") {
        errors.push(`Dòng ${lineNum}: Thiếu câu hỏi`)
        return
      }

      if (!Array.isArray(item.options) || item.options.length < 2) {
        errors.push(`Dòng ${lineNum}: Cần ít nhất 2 đáp án`)
        return
      }

      const correctAnswer = typeof item.correctAnswer === "number" ? item.correctAnswer : parseInt(item.correctAnswer)
      if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= item.options.length) {
        errors.push(`Dòng ${lineNum}: Đáp án đúng không hợp lệ`)
        return
      }

      questions.push({
        question: item.question.trim(),
        options: item.options.map((o: string) => String(o).trim()),
        correctAnswer,
        explanation: item.explanation?.trim() || "",
        topic: item.topic?.trim() || "",
      })
    })
  } catch (e) {
    errors.push("Lỗi cú pháp JSON: " + (e as Error).message)
  }

  return { questions, errors }
}

function parseCSV(content: string): ParseResult {
  const questions: QuestionFormData[] = []
  const errors: string[] = []

  const lines = content.trim().split("\n")
  if (lines.length < 2) {
    return { questions: [], errors: ["File CSV cần có ít nhất header và 1 dòng dữ liệu"] }
  }

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line (handles quoted fields)
    const fields: string[] = []
    let current = ""
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    fields.push(current.trim())

    // Parse fields: question, optionA, optionB, optionC, optionD, correctAnswer, explanation, topic
    const [question, optA, optB, optC, optD, correctStr, explanation, topic] = fields

    if (!question) {
      errors.push(`Dòng ${i + 1}: Thiếu câu hỏi`)
      continue
    }

    const options = [optA, optB, optC, optD].filter((o) => o && o.trim())
    if (options.length < 2) {
      errors.push(`Dòng ${i + 1}: Cần ít nhất 2 đáp án`)
      continue
    }

    const correctAnswer = parseInt(correctStr)
    if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
      errors.push(`Dòng ${i + 1}: Đáp án đúng không hợp lệ (0-${options.length - 1})`)
      continue
    }

    questions.push({
      question: question.trim(),
      options,
      correctAnswer,
      explanation: explanation?.trim() || "",
      topic: topic?.trim() || "",
    })
  }

  return { questions, errors }
}

function parseText(content: string): ParseResult {
  const questions: QuestionFormData[] = []
  const errors: string[] = []

  // Split by double newline or "Q:" pattern
  const blocks = content.split(/\n\s*\n/).filter((b) => b.trim())

  blocks.forEach((block, index) => {
    const lines = block.trim().split("\n").map((l) => l.trim())
    
    let question = ""
    const options: string[] = []
    let correctAnswer = -1
    let explanation = ""
    let topic = ""

    for (const line of lines) {
      if (line.startsWith("Q:") || line.startsWith("Question:")) {
        question = line.replace(/^(Q:|Question:)\s*/i, "").trim()
      } else if (/^[A-D][:.)]\s*/i.test(line)) {
        const opt = line.replace(/^[A-D][:.)]\s*/i, "").trim()
        options.push(opt)
      } else if (line.startsWith("Answer:") || line.startsWith("Correct:")) {
        const ans = line.replace(/^(Answer:|Correct:)\s*/i, "").trim().toUpperCase()
        correctAnswer = ans.charCodeAt(0) - 65 // A=0, B=1, C=2, D=3
      } else if (line.startsWith("Explanation:") || line.startsWith("Explain:")) {
        explanation = line.replace(/^(Explanation:|Explain:)\s*/i, "").trim()
      } else if (line.startsWith("Topic:") || line.startsWith("Subject:")) {
        topic = line.replace(/^(Topic:|Subject:)\s*/i, "").trim()
      }
    }

    if (!question) {
      errors.push(`Block ${index + 1}: Thiếu câu hỏi (bắt đầu với "Q:")`)
      return
    }

    if (options.length < 2) {
      errors.push(`Block ${index + 1}: Cần ít nhất 2 đáp án (A:, B:, C:, D:)`)
      return
    }

    if (correctAnswer < 0 || correctAnswer >= options.length) {
      errors.push(`Block ${index + 1}: Thiếu hoặc sai đáp án đúng (Answer: A/B/C/D)`)
      return
    }

    questions.push({
      question,
      options,
      correctAnswer,
      explanation,
      topic,
    })
  })

  return { questions, errors }
}

export function ImportQuestionsDialog({ onImport, children }: ImportQuestionsDialogProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [format, setFormat] = useState<FormatType>("pdf")
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [ocrText, setOcrText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<"idle" | "ocr" | "format" | "done">("idle")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [showOcrPreview, setShowOcrPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const handleParse = () => {
    let result: ParseResult
    switch (format) {
      case "json":
        result = parseJSON(content)
        break
      case "csv":
        result = parseCSV(content)
        break
      case "text":
        result = parseText(content)
        break
      case "pdf":
        // PDF parsing is handled separately
        return
    }
    setParseResult(result)
  }

  const handleImport = () => {
    if (parseResult && parseResult.questions.length > 0) {
      onImport(parseResult.questions)
      resetState()
    }
  }

  const resetState = () => {
    setOpen(false)
    setContent("")
    setParseResult(null)
    setPdfFile(null)
    setOcrText("")
    setProcessingStep("idle")
    setProcessingProgress(0)
    setShowOcrPreview(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setContent(text)
      setParseResult(null)
      
      // Auto-detect format
      if (file.name.endsWith(".json")) {
        setFormat("json")
      } else if (file.name.endsWith(".csv")) {
        setFormat("csv")
      } else {
        setFormat("text")
      }
    }
    reader.readAsText(file)
  }

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setPdfFile(file)
    setOcrText("")
    setParseResult(null)
    setProcessingStep("idle")
  }

  const handleProcessPdf = async () => {
    if (!pdfFile) return

    setIsProcessing(true)
    setProcessingStep("ocr")
    setProcessingProgress(20)

    try {
      // Step 1: OCR with Mistral
      const formData = new FormData()
      formData.append("file", pdfFile)

      const ocrResponse = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })

      if (!ocrResponse.ok) {
        const error = await ocrResponse.json()
        throw new Error(error.error || "OCR failed")
      }

      const ocrData = await ocrResponse.json()
      const extractedText = ocrData.text
      setOcrText(extractedText)
      setProcessingProgress(60)

      // Step 2: Format with Groq AI
      setProcessingStep("format")
      
      const formatResponse = await fetch("/api/format-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      })

      if (!formatResponse.ok) {
        const error = await formatResponse.json()
        throw new Error(error.error || "Formatting failed")
      }

      const formatData = await formatResponse.json()
      setProcessingProgress(100)
      setProcessingStep("done")

      // Convert to QuestionFormData format
      const questions: QuestionFormData[] = formatData.questions.map((q: {
        question: string
        options: string[]
        correctAnswer: number
        explanation?: string
        topic?: string
      }) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer >= 0 ? q.correctAnswer : 0,
        explanation: q.explanation || "",
        topic: q.topic || "",
      }))

      const errors: string[] = []
      
      // Check for questions without correct answer
      formatData.questions.forEach((q: { correctAnswer: number; question: string }, i: number) => {
        if (q.correctAnswer < 0) {
          errors.push(`Câu ${i + 1}: Chưa xác định đáp án đúng - cần chọn thủ công`)
        }
      })

      setParseResult({ questions, errors })
    } catch (error) {
      console.error("PDF processing error:", error)
      setParseResult({
        questions: [],
        errors: [(error as Error).message || "Có lỗi xảy ra khi xử lý PDF"],
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const copyExample = (example: string) => {
    navigator.clipboard.writeText(example)
  }

  const examples: Record<"json" | "csv" | "text", string> = {
    json: JSON_EXAMPLE,
    csv: CSV_EXAMPLE,
    text: TEXT_EXAMPLE,
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetState()
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import từ file
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import câu hỏi</DialogTitle>
          <DialogDescription>
            Nhập nhiều câu hỏi cùng lúc từ file hoặc paste nội dung
          </DialogDescription>
        </DialogHeader>

        <Tabs value={format} onValueChange={(v) => {
          setFormat(v as FormatType)
          setParseResult(null)
        }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Upload AI
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text
            </TabsTrigger>
          </TabsList>

          {/* JSON, CSV, Text tabs */}
          {format !== "pdf" && (
            <TabsContent value={format} className="space-y-4">
              {/* Example */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Ví dụ định dạng:</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyExample(examples[format as keyof typeof examples])}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-32">
                  {examples[format as keyof typeof examples]}
                </pre>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Tải file lên:</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Chọn file (.json, .csv, .txt)
                </Button>
              </div>

              {/* Content Input */}
              <div className="space-y-2">
                <Label>Hoặc paste nội dung:</Label>
                <Textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    setParseResult(null)
                  }}
                  placeholder="Paste nội dung câu hỏi vào đây..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
          )}

          {/* PDF tab with AI processing */}
          <TabsContent value="pdf" className="space-y-4">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <strong>Hỗ trợ:</strong> PDF, Word (DOCX), Ảnh (JPG, PNG, ...)<br />
                <strong>AI:</strong> Tự động đọc và phân tích câu hỏi từ file của bạn
              </AlertDescription>
            </Alert>

            {/* PDF Upload */}
            <div className="space-y-2">
              <Label>Tải file lên:</Label>
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                onChange={handlePdfUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => pdfInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Chọn file (PDF, Word, Ảnh)
              </Button>
              {pdfFile && (
                <p className="text-sm text-muted-foreground">
                  Đã chọn: <strong>{pdfFile.name}</strong> ({(pdfFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Processing Progress */}
            {isProcessing && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {processingStep === "ocr" && "Đang đọc văn bản từ file (OCR)..."}
                    {processingStep === "format" && "Đang phân tích và format câu hỏi với AI..."}
                  </span>
                </div>
                <Progress value={processingProgress} />
              </div>
            )}

            {/* OCR Preview */}
            {ocrText && !isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Văn bản đã đọc được:</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOcrPreview(!showOcrPreview)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {showOcrPreview ? "Ẩn" : "Xem"}
                  </Button>
                </div>
                {showOcrPreview && (
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48 whitespace-pre-wrap">
                    {ocrText}
                  </pre>
                )}
              </div>
            )}

            {/* Process Button */}
            {pdfFile && !isProcessing && processingStep === "idle" && (
              <Button onClick={handleProcessPdf} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Xử lý với AI
              </Button>
            )}
          </TabsContent>
        </Tabs>

        {/* Parse Result */}
        {parseResult && (
          <div className="space-y-2">
            {parseResult.questions.length > 0 && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Đã phân tích thành công <Badge variant="secondary">{parseResult.questions.length}</Badge> câu hỏi
                </AlertDescription>
              </Alert>
            )}
            {parseResult.errors.length > 0 && (
              <Alert variant={parseResult.questions.length > 0 ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">{parseResult.errors.length} lưu ý:</p>
                  <ul className="text-xs list-disc list-inside">
                    {parseResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>... và {parseResult.errors.length - 5} lưu ý khác</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          {format !== "pdf" ? (
            !parseResult ? (
              <Button onClick={handleParse} disabled={!content.trim()}>
                Kiểm tra
              </Button>
            ) : (
              <Button
                onClick={handleImport}
                disabled={parseResult.questions.length === 0}
              >
                Import {parseResult.questions.length} câu hỏi
              </Button>
            )
          ) : (
            parseResult && parseResult.questions.length > 0 && (
              <Button onClick={handleImport}>
                Import {parseResult.questions.length} câu hỏi
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
