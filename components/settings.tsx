"use client"

import type React from "react"
import type { User } from "@supabase/supabase-js"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type UserProgress, exportData, importData, saveProgress, getDefaultProgress } from "@/lib/storage"
import { ArrowLeft, Download, Upload, Trash2, AlertTriangle, Cloud, CloudOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SettingsProps {
  progress: UserProgress
  setProgress: (progress: UserProgress) => void
  onBack: () => void
  user: User | null // Added user prop
}

export function Settings({ progress, setProgress, onBack, user }: SettingsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = exportData(progress)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quiz-progress-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const imported = importData(content)
        if (imported) {
          setProgress(imported)
          await saveProgress(user, imported)
          setImportSuccess(true)
          setImportError(null)
          setTimeout(() => setImportSuccess(false), 3000)
        } else {
          setImportError("File không hợp lệ")
        }
      } catch {
        setImportError("Lỗi khi đọc file")
      }
    }
    reader.readAsText(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleReset = async () => {
    const defaultProgress = getDefaultProgress()
    setProgress(defaultProgress)
    await saveProgress(user, defaultProgress)
    setShowResetConfirm(false)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </Button>

      <h2 className="text-2xl font-bold">Cài đặt</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {user ? (
              <Cloud className="h-5 w-5 text-green-500" />
            ) : (
              <CloudOff className="h-5 w-5 text-muted-foreground" />
            )}
            Trạng thái tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Email:</span> <span className="font-medium">{user.email}</span>
              </p>
              <p className="text-sm text-green-600">Dữ liệu được đồng bộ lên cloud</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Đang sử dụng chế độ Guest</p>
              <p className="text-sm text-amber-600">
                Dữ liệu chỉ được lưu trên thiết bị này. Đăng nhập để đồng bộ lên cloud.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Xuất dữ liệu</CardTitle>
          <CardDescription>Tải xuống file backup chứa toàn bộ tiến độ học tập của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Xuất file JSON
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nhập dữ liệu</CardTitle>
          <CardDescription>Khôi phục tiến độ từ file backup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Chọn file JSON
          </Button>

          {importError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}

          {importSuccess && (
            <Alert>
              <AlertTitle>Thành công!</AlertTitle>
              <AlertDescription>Đã nhập dữ liệu thành công.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Xóa dữ liệu</CardTitle>
          <CardDescription>Xóa toàn bộ tiến độ học tập. Hành động này không thể hoàn tác.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showResetConfirm ? (
            <Button variant="destructive" onClick={() => setShowResetConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa toàn bộ dữ liệu
            </Button>
          ) : (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Xác nhận xóa</AlertTitle>
                <AlertDescription>
                  Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleReset}>
                  Xác nhận xóa
                </Button>
                <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thống kê</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Câu hỏi đã làm:</span>
            <span>{Object.keys(progress.cardProgress).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Câu đã đánh dấu:</span>
            <span>{progress.bookmarkedQuestions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ghi chú:</span>
            <span>{Object.keys(progress.notes).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phiên học:</span>
            <span>{progress.studySessions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Streak hiện tại:</span>
            <span>{progress.streak} ngày</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
