import { describe, it, expect } from "vitest"
import { calculateNextReview, getInitialProgress, Quality } from "./spaced-repetition"

describe("SM-2 Algorithm", () => {
  it("should initialize a new card correctly", () => {
    const progress = getInitialProgress("q1")
    expect(progress.questionId).toBe("q1")
    expect(progress.easeFactor).toBe(2.5)
    expect(progress.repetitions).toBe(0)
    expect(progress.interval).toBe(0)
  })

  it("should handle the first review (Perfect - Quality 5)", () => {
    const initial = getInitialProgress("q1")
    const next = calculateNextReview(5, initial)
    
    expect(next.repetitions).toBe(1)
    expect(next.interval).toBe(1)
    expect(next.easeFactor).toBeGreaterThan(2.5)
  })

  it("should handle the second review (Quality 4)", () => {
    const initial = getInitialProgress("q1")
    const first = calculateNextReview(5, initial)
    const second = calculateNextReview(4, first)
    
    expect(second.repetitions).toBe(2)
    expect(second.interval).toBe(6)
  })

  it("should reset progress on failure (Quality < 3)", () => {
    const initial = getInitialProgress("q1")
    const first = calculateNextReview(5, initial)
    const second = calculateNextReview(2, first)
    
    expect(second.repetitions).toBe(0)
    expect(second.interval).toBe(1)
    expect(second.easeFactor).toBeLessThan(first.easeFactor)
  })

  it("should calculate increasing intervals for repeated success", () => {
    const initial = getInitialProgress("q1")
    const r1 = calculateNextReview(5, initial)
    const r2 = calculateNextReview(5, r1)
    const r3 = calculateNextReview(5, r2)
    
    expect(r3.repetitions).toBe(3)
    expect(r3.interval).toBeGreaterThan(6)
    expect(r3.interval).toBe(Math.round(r2.interval * r2.easeFactor))
  })

  it("should not let ease factor drop below 1.3", () => {
    let progress = getInitialProgress("q1")
    // Repeat many low quality but "correct" (3) answers
    for (let i = 0; i < 20; i++) {
      progress = calculateNextReview(3, progress)
    }
    expect(progress.easeFactor).toBeGreaterThanOrEqual(1.3)
  })
})

