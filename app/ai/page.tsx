"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AIAssistant } from "@/components/ai-assistant"
import type { Question } from "@/lib/questions"

export default function AIPage() {
  const router = useRouter()
  const [initialQuestion, setInitialQuestion] = useState<Question | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem("ai_initial_question")
    if (saved) {
      try {
        setInitialQuestion(JSON.parse(saved))
        sessionStorage.removeItem("ai_initial_question")
      } catch (e) {
        console.error("Failed to parse initial question", e)
      }
    }
  }, [])

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8">
      <AIAssistant
        onBack={() => router.push("/")}
        initialQuestion={initialQuestion}
      />
    </main>
  )
}

