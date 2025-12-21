import { type CardProgress, getInitialProgress } from "./spaced-repetition"

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
  wrongAnswers: string[] // IDs of questions answered incorrectly
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

export function loadProgress(): UserProgress {
  if (typeof window === "undefined") return getDefaultProgress()

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return getDefaultProgress()

    const parsed = JSON.parse(saved)
    // Convert date strings back to Date objects
    if (parsed.cardProgress) {
      Object.values(parsed.cardProgress).forEach((cp: unknown) => {
        const card = cp as CardProgress
        card.nextReviewDate = new Date(card.nextReviewDate)
        if (card.lastReviewDate) {
          card.lastReviewDate = new Date(card.lastReviewDate)
        }
      })
    }
    if (parsed.studySessions) {
      parsed.studySessions.forEach((s: StudySession) => {
        s.date = new Date(s.date)
      })
    }
    return { ...getDefaultProgress(), ...parsed }
  } catch {
    return getDefaultProgress()
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function getCardProgress(progress: UserProgress, questionId: string): CardProgress {
  return progress.cardProgress[questionId] || getInitialProgress(questionId)
}

export function getDueCards(progress: UserProgress, questionIds: string[]): string[] {
  const now = new Date()
  return questionIds.filter((id) => {
    const card = progress.cardProgress[id]
    if (!card) return true // New cards are always due
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
