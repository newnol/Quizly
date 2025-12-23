"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QuestionSetCard } from "@/components/question-set-card"
import { getPublicQuestionSets, copyQuestionSet, type QuestionSet } from "@/lib/question-sets"
import { ArrowLeft, Search, Globe, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ExplorePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [copying, setCopying] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        const sets = await getPublicQuestionSets()
        setQuestionSets(sets)
      } catch (error) {
        console.error("Error loading question sets:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleCopy = async (setId: string) => {
    if (!user) {
      router.push("/?login=true")
      return
    }

    setCopying(setId)
    try {
      const newSet = await copyQuestionSet(user.id, setId)
      if (newSet) {
        router.push(`/sets/${newSet.id}`)
      }
    } catch (error) {
      console.error("Error copying question set:", error)
      alert("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setCopying(null)
    }
  }

  const filteredSets = questionSets.filter((set) =>
    set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    set.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Đang tải...</div>
      </div>
    )
  }

  return (
    <main className="container max-w-4xl mx-auto p-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Khám phá
          </h1>
          <p className="text-sm text-muted-foreground">
            Tìm và học từ bộ câu hỏi của cộng đồng
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm bộ câu hỏi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Question Sets Grid */}
      {filteredSets.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          {searchQuery ? (
            <>
              <p className="text-lg font-medium">Không tìm thấy kết quả</p>
              <p className="text-sm text-muted-foreground mt-1">
                Thử tìm kiếm với từ khóa khác
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">Chưa có bộ câu hỏi công khai nào</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hãy là người đầu tiên chia sẻ!
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredSets.map((set) => (
            <QuestionSetCard
              key={set.id}
              questionSet={set}
              isOwner={user?.id === set.owner_id}
              onView={() => router.push(`/sets/${set.id}`)}
              onEdit={user?.id === set.owner_id ? () => router.push(`/sets/${set.id}/edit`) : undefined}
              onCopy={user?.id !== set.owner_id ? () => handleCopy(set.id) : undefined}
            />
          ))}
        </div>
      )}
    </main>
  )
}

