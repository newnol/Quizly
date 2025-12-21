import { type CardProgress, getInitialProgress } from "./spaced-repetition"
import { createClient } from "./supabase/client"
import type { User } from "@supabase/supabase-js"

export interface StudySession {
  date: Date
  questionsAnswered: number
  correctAnswers: number
  mode: "quiz" | "flashcard" | "review"
}

export interface UserProgress {
  cardProgress: Record<string, CardProgress>
  bookmarkedQuestions: string[]
  notes: Record<string, string>
  studySessions: StudySession[]
  streak: number
  lastStudyDate: string | null
  wrongAnswers: string[]
}

const STORAGE_KEY = "quiz-app-progress"

export function getDefaultProgress(): UserProgress {
  return {
    cardProgress: {},
    bookmarkedQuestions: [],
    notes: {},
    studySessions: [],
    streak: 0,
    lastStudyDate: null,
    wrongAnswers: [],
  }
}

export function loadProgressFromLocal(): UserProgress {
  if (typeof window === "undefined") return getDefaultProgress()

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return getDefaultProgress()

    const parsed = JSON.parse(saved)
    return parseProgress(parsed)
  } catch {
    return getDefaultProgress()
  }
}

function parseProgress(parsed: Record<string, unknown>): UserProgress {
  if (parsed.cardProgress) {
    Object.values(parsed.cardProgress).forEach((cp: unknown) => {
      const card = cp as CardProgress
      card.nextReviewDate = new Date(card.nextReviewDate)
      if (card.lastReviewDate) {
        card.lastReviewDate = new Date(card.lastReviewDate)
      }
    })
  }
  if (parsed.studySessions && Array.isArray(parsed.studySessions)) {
    parsed.studySessions.forEach((s: StudySession) => {
      s.date = new Date(s.date)
    })
  }
  return { ...getDefaultProgress(), ...parsed } as UserProgress
}

export async function loadProgressFromSupabase(userId: string): Promise<UserProgress> {
  const supabase = createClient()

  const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", userId).single()

  if (error || !data) {
    return getDefaultProgress()
  }

  return parseProgress({
    cardProgress: data.card_progress || {},
    bookmarkedQuestions: data.bookmarked_questions || [],
    notes: data.notes || {},
    studySessions: data.study_sessions || [],
    streak: data.streak || 0,
    lastStudyDate: data.last_study_date,
    wrongAnswers: data.wrong_answers || [],
  })
}

export function saveProgressToLocal(progress: UserProgress): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export async function saveProgressToSupabase(userId: string, progress: UserProgress): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      card_progress: progress.cardProgress,
      bookmarked_questions: progress.bookmarkedQuestions,
      notes: progress.notes,
      study_sessions: progress.studySessions,
      streak: progress.streak,
      last_study_date: progress.lastStudyDate,
      wrong_answers: progress.wrongAnswers,
    },
    { onConflict: "user_id" },
  )

  if (error) {
    console.error("Error saving progress to Supabase:", error)
  }
}

export async function loadProgress(user: User | null): Promise<UserProgress> {
  if (user) {
    return loadProgressFromSupabase(user.id)
  }
  return loadProgressFromLocal()
}

export async function saveProgress(user: User | null, progress: UserProgress): Promise<void> {
  if (user) {
    await saveProgressToSupabase(user.id, progress)
  } else {
    saveProgressToLocal(progress)
  }
}

export async function syncLocalToSupabase(userId: string): Promise<UserProgress> {
  const localProgress = loadProgressFromLocal()
  const supabaseProgress = await loadProgressFromSupabase(userId)

  // Merge progress - prefer the one with more data
  const localCount = Object.keys(localProgress.cardProgress).length
  const supabaseCount = Object.keys(supabaseProgress.cardProgress).length

  if (localCount > supabaseCount) {
    // Local has more progress, save it to Supabase
    await saveProgressToSupabase(userId, localProgress)
    return localProgress
  }

  return supabaseProgress
}

export function getCardProgress(progress: UserProgress, questionId: string): CardProgress {
  return progress.cardProgress[questionId] || getInitialProgress(questionId)
}

export function getDueCards(progress: UserProgress, questionIds: string[]): string[] {
  const now = new Date()
  return questionIds.filter((id) => {
    const card = progress.cardProgress[id]
    if (!card) return true
    return new Date(card.nextReviewDate) <= now
  })
}

export function updateStreak(progress: UserProgress): UserProgress {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  if (progress.lastStudyDate === today) {
    return progress
  }

  if (progress.lastStudyDate === yesterday) {
    return {
      ...progress,
      streak: progress.streak + 1,
      lastStudyDate: today,
    }
  }

  return {
    ...progress,
    streak: 1,
    lastStudyDate: today,
  }
}

export function exportData(progress: UserProgress): string {
  return JSON.stringify(progress, null, 2)
}

export function importData(jsonString: string): UserProgress | null {
  try {
    const parsed = JSON.parse(jsonString)
    return { ...getDefaultProgress(), ...parsed }
  } catch {
    return null
  }
}
