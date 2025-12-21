"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, UserPlus, LogIn, ArrowLeft } from "lucide-react"

interface AuthFormProps {
  onBack: () => void
  onSuccess: () => void
}

export function AuthForm({ onBack, onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onSuccess()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          },
        })
        if (error) throw error
        setMessage("Kiểm tra email của bạn để xác nhận tài khoản!")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Button variant="ghost" size="sm" onClick={onBack} className="w-fit -ml-2 mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <CardTitle className="text-2xl font-bold">{isLogin ? "Đăng nhập" : "Đăng ký"}</CardTitle>
          <CardDescription>
            {isLogin ? "Đăng nhập để đồng bộ tiến độ học tập" : "Tạo tài khoản mới để lưu trữ tiến độ"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isLogin ? (
                <LogIn className="h-4 w-4 mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}</span>{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null)
                  setMessage(null)
                }}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Đăng ký" : "Đăng nhập"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
