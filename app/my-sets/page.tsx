"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QuestionSetCard } from "@/components/question-set-card"
import { getMyQuestionSets, deleteQuestionSet, type QuestionSet } from "@/lib/question-sets"
import { ArrowLeft, Plus, Search, FolderOpen } from "lucide-react"
import Link from "next/link"

export default function MySetsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)

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

        const sets = await getMyQuestionSets(currentUser.id)
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
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (event === "SIGNED_OUT") {
        router.push("/")
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, router])

  const handleDelete = async (setId: string) => {
    if (!confirm("Bạn có chắc muốn xóa bộ câu hỏi này?")) return

    setDeleting(setId)
    try {
      const success = await deleteQuestionSet(setId)
      if (success) {
        setQuestionSets((prev) => prev.filter((s) => s.id !== setId))
      }
    } catch (error) {
      console.error("Error deleting question set:", error)
    } finally {
      setDeleting(null)
    }
  }

  const filteredSets = questionSets.filter((set) =>
    set.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Bộ câu hỏi của tôi</h1>
            <p className="text-sm text-muted-foreground">
              {questionSets.length} bộ câu hỏi
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/sets/new">
            <Plus className="h-4 w-4 mr-2" />
            Tạo mới
          </Link>
        </Button>
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
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          {searchQuery ? (
            <>
              <p className="text-lg font-medium">Không tìm thấy kết quả</p>
              <p className="text-sm text-muted-foreground mt-1">
                Thử tìm kiếm với từ khóa khác
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">Chưa có bộ câu hỏi nào</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tạo bộ câu hỏi đầu tiên của bạn
              </p>
              <Button className="mt-4" asChild>
                <Link href="/sets/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo bộ câu hỏi
                </Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredSets.map((set) => (
            <QuestionSetCard
              key={set.id}
              questionSet={set}
              isOwner={true}
              onView={() => router.push(`/sets/${set.id}`)}
              onEdit={() => router.push(`/sets/${set.id}/edit`)}
              onDelete={() => handleDelete(set.id)}
            />
          ))}
        </div>
      )}
    </main>
  )
}

