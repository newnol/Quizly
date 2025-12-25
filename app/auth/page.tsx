"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthForm } from "@/components/auth-form"

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo") || "/"

  return (
    <AuthForm 
      onBack={() => router.push(returnTo)} 
      onSuccess={() => router.push(returnTo)} 
    />
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <AuthContent />
    </Suspense>
  )
}

