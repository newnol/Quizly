import { type CardProgress, getInitialProgress, type Quality } from "./spaced-repetition"
import { createClient } from "./supabase/client"
import type { User } from "@supabase/supabase-js"
import * as IndexedDBStorage from "./indexeddb-storage"

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

export async function loadProgressFromLocal(): Promise<UserProgress> {
  if (typeof window === "undefined") return getDefaultProgress()

  try {
    // Add a 3-second timeout for IndexedDB to prevent hanging
    const saved = await Promise.race([
      IndexedDBStorage.getItem<UserProgress>(STORAGE_KEY),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
    ])

    if (saved) {
      return parseProgress(saved as Record<string, unknown>)
    }

    // Fallback: Try localStorage
    const localStorageData = localStorage.getItem(STORAGE_KEY)
    if (localStorageData) {
      try {
        const parsed = JSON.parse(localStorageData)
        const progress = parseProgress(parsed)
        // Attempt to migrate to IndexedDB in background
        IndexedDBStorage.setItem(STORAGE_KEY, progress).catch(console.error)
        return progress
      } catch (e) {
        console.error("Failed to parse localStorage data", e)
      }
    }

    return getDefaultProgress()
  } catch (error) {
    console.error("Error loading progress from local:", error)
    return getDefaultProgress()
  }
}

function parseProgress(parsed: Record<string, unknown>): UserProgress {
  // Handle naming differences between DB (snake_case) and Code (camelCase)
  const normalizedData = {
    ...parsed,
    wrongAnswers: parsed.wrongAnswers || (parsed as any).wrong_answers || [],
    cardProgress: parsed.cardProgress || (parsed as any).card_progress || {},
    bookmarkedQuestions: parsed.bookmarkedQuestions || (parsed as any).bookmarked_questions || [],
    studySessions: parsed.studySessions || (parsed as any).study_sessions || [],
    lastStudyDate: parsed.lastStudyDate || (parsed as any).last_study_date || null,
  }

  const progress = { ...getDefaultProgress(), ...normalizedData } as UserProgress
  
  if (progress.cardProgress) {
    const updatedCardProgress: Record<string, CardProgress> = {}
    Object.entries(progress.cardProgress).forEach(([id, cp]) => {
      updatedCardProgress[id] = {
        ...cp,
        nextReviewDate: new Date(cp.nextReviewDate),
        lastReviewDate: cp.lastReviewDate ? new Date(cp.lastReviewDate) : null,
      }
    })
    progress.cardProgress = updatedCardProgress
  }
  
  if (progress.studySessions && Array.isArray(progress.studySessions)) {
    progress.studySessions = progress.studySessions.map((s: any) => ({
      ...s,
      date: new Date(s.date),
    }))
  }
  
  return progress
}

export async function loadProgressFromSupabase(userId: string): Promise<UserProgress> {
  const supabase = createClient()

  try {
    // Add a 5-second safety timeout
    const result = await Promise.race([
      supabase.from("user_progress").select("*").eq("user_id", userId).single(),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("Supabase timeout")), 5000)
      )
    ])

    const { data, error } = result

    if (error) {
      if (error.code === 'PGRST116') return getDefaultProgress()
      throw error
    }

    if (!data) return getDefaultProgress()

    return parseProgress(data)
  } catch (error) {
    console.error("Failed to load from Supabase:", error)
    return getDefaultProgress()
  }
}

export async function saveProgressToLocal(progress: UserProgress): Promise<void> {
  if (typeof window === "undefined") return
  
  try {
    await IndexedDBStorage.setItem(STORAGE_KEY, progress)
    // Backup to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (error) {
    console.error("Error saving progress to local:", error)
  }
}

export async function saveProgressToSupabase(userId: string, progress: UserProgress): Promise<void> {
  try {
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

    if (error) throw error
  } catch (error) {
    console.error("Error saving progress to Supabase:", error)
  }
}

export async function saveProgress(user: User | null, progress: UserProgress): Promise<void> {
  // Always save to local first (IndexedDB)
  await saveProgressToLocal(progress)

  // If user is logged in, also save to Supabase
  if (user) {
    await saveProgressToSupabase(user.id, progress)
  }
}

export async function loadProgress(user: User | null): Promise<UserProgress> {
  // 1. Always load from local storage first for instant availability
  const localProgress = await loadProgressFromLocal()
  
  // 2. If no user, just return local progress
  if (!user) {
    return localProgress
  }

  try {
    // 3. If logged in, fetch from Supabase
    const supabaseProgress = await loadProgressFromSupabase(user.id)
    
    // 4. Merge progress
    const mergedProgress: UserProgress = {
      ...localProgress,
      cardProgress: { ...supabaseProgress.cardProgress, ...localProgress.cardProgress },
      bookmarkedQuestions: [...new Set([...supabaseProgress.bookmarkedQuestions, ...localProgress.bookmarkedQuestions])],
      notes: { ...supabaseProgress.notes, ...localProgress.notes },
      studySessions: mergeStudySessions(supabaseProgress.studySessions, localProgress.studySessions),
      streak: Math.max(supabaseProgress.streak, localProgress.streak),
      lastStudyDate: (supabaseProgress.lastStudyDate && (!localProgress.lastStudyDate || new Date(supabaseProgress.lastStudyDate) > new Date(localProgress.lastStudyDate))) 
        ? supabaseProgress.lastStudyDate 
        : localProgress.lastStudyDate,
      wrongAnswers: [...new Set([...supabaseProgress.wrongAnswers, ...localProgress.wrongAnswers])],
    }

    // Update local with merged data
    await saveProgressToLocal(mergedProgress)
    
    return mergedProgress
  } catch (error) {
    console.error("Error merging progress, using local data only:", error)
    return localProgress
  }
}

function mergeStudySessions(sessionsA: StudySession[], sessionsB: StudySession[]): StudySession[] {
  const allSessions = [...sessionsA, ...sessionsB]
  const uniqueSessions: Record<string, StudySession> = {}
  allSessions.forEach(s => {
    // Basic deduplication
    const key = `${new Date(s.date).getTime()}_${s.mode}_${s.questionsAnswered}`
    uniqueSessions[key] = s
  })
  return Object.values(uniqueSessions).sort((a, b) => b.date.getTime() - a.date.getTime())
}

export async function syncLocalToSupabase(userId: string): Promise<UserProgress> {
  return loadProgress({ id: userId } as User)
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
    return parseProgress(parsed)
  } catch {
    return null
  }
}

// =====================
// Question Set Progress Helpers
// =====================

export function getProgressForQuestionSet(
  progress: UserProgress,
  questionIds: string[]
): {
  totalQuestions: number
  reviewedCount: number
  masteredCount: number
  dueCount: number
  averageEaseFactor: number
} {
  const now = new Date()
  let reviewedCount = 0
  let masteredCount = 0
  let dueCount = 0
  let totalEaseFactor = 0
  let easeCount = 0

  questionIds.forEach((id) => {
    const card = progress.cardProgress[id]
    if (card) {
      if (card.lastReviewDate) {
        reviewedCount++
        totalEaseFactor += card.easeFactor
        easeCount++
      }
      if (card.repetitions >= 3 && card.easeFactor >= 2.5) {
        masteredCount++
      }
      if (new Date(card.nextReviewDate) <= now) {
        dueCount++
      }
    } else {
      dueCount++ // Never reviewed = due
    }
  })

  return {
    totalQuestions: questionIds.length,
    reviewedCount,
    masteredCount,
    dueCount,
    averageEaseFactor: easeCount > 0 ? totalEaseFactor / easeCount : 2.5,
  }
}

export function getWrongAnswersForQuestionSet(
  progress: UserProgress,
  questionIds: string[]
): string[] {
  return progress.wrongAnswers.filter((id) => questionIds.includes(id))
}

export function getBookmarkedForQuestionSet(
  progress: UserProgress,
  questionIds: string[]
): string[] {
  return progress.bookmarkedQuestions.filter((id) => questionIds.includes(id))
}

export function getNotesForQuestionSet(
  progress: UserProgress,
  questionIds: string[]
): Record<string, string> {
  const notes: Record<string, string> = {}
  questionIds.forEach((id) => {
    if (progress.notes[id]) {
      notes[id] = progress.notes[id]
    }
  })
  return notes
}
