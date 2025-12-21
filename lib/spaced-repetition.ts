// SM-2 Algorithm Implementation
export interface CardProgress {
  questionId: string
  easeFactor: number // Default 2.5, min 1.3
  interval: number // Days until next review
  repetitions: number // Number of successful reviews
  nextReviewDate: Date
  lastReviewDate: Date | null
}

export type Quality = 0 | 1 | 2 | 3 | 4 | 5
// 0: Complete blackout
// 1: Incorrect, but remembered upon seeing answer
// 2: Incorrect, but answer seemed easy to recall
// 3: Correct with difficulty
// 4: Correct after some hesitation
// 5: Perfect recall

export function calculateNextReview(quality: Quality, currentProgress: CardProgress): CardProgress {
  const { easeFactor, interval, repetitions } = currentProgress

  let newInterval: number
  let newRepetitions: number
  let newEaseFactor: number = easeFactor

  if (quality < 3) {
    // Failed recall - reset
    newRepetitions = 0
    newInterval = 1
  } else {
    // Successful recall
    newRepetitions = repetitions + 1

    if (repetitions === 0) {
      newInterval = 1
    } else if (repetitions === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * easeFactor)
    }
  }

  // Update ease factor
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  newEaseFactor = Math.max(1.3, newEaseFactor) // Minimum ease factor is 1.3

  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

  return {
    questionId: currentProgress.questionId,
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
    lastReviewDate: new Date(),
  }
}

export function getInitialProgress(questionId: string): CardProgress {
  return {
    questionId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date(),
    lastReviewDate: null,
  }
}

export function qualityFromAnswer(isCorrect: boolean, timeTaken: number): Quality {
  if (!isCorrect) {
    return timeTaken < 5000 ? 1 : 0 // Quick wrong = 1, slow wrong = 0
  }

  if (timeTaken < 3000) return 5 // Very fast = perfect
  if (timeTaken < 8000) return 4 // Moderate = good
  return 3 // Slow but correct = difficult
}
