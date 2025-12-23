import { createClient } from "./supabase/client"

export interface QuestionSet {
  id: string
  owner_id: string | null
  title: string
  description: string | null
  visibility: "public" | "private" | "unlisted"
  cover_image: string | null
  question_count: number
  copy_count: number
  copied_from: string | null
  is_system: boolean
  created_at: string
  updated_at: string
  // Joined data
  owner?: {
    email: string
  }
}

export interface Question {
  id: string
  question_set_id: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string | null
  topic: string | null
  order_index: number
  created_at: string
}

export interface CreateQuestionSetInput {
  title: string
  description?: string
  visibility?: "public" | "private" | "unlisted"
  cover_image?: string
}

export interface UpdateQuestionSetInput {
  title?: string
  description?: string
  visibility?: "public" | "private" | "unlisted"
  cover_image?: string
}

export interface CreateQuestionInput {
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
  topic?: string
  order_index?: number
}

export interface UpdateQuestionInput {
  question?: string
  options?: string[]
  correct_answer?: number
  explanation?: string
  topic?: string
  order_index?: number
}

// =====================
// Question Sets CRUD
// =====================

export async function getQuestionSets(options?: {
  visibility?: "public" | "private" | "unlisted"
  ownerId?: string
  limit?: number
  offset?: number
  search?: string
}): Promise<QuestionSet[]> {
  const supabase = createClient()
  
  let query = supabase
    .from("question_sets")
    .select("*")
    .order("created_at", { ascending: false })

  if (options?.visibility) {
    query = query.eq("visibility", options.visibility)
  }

  if (options?.ownerId) {
    query = query.eq("owner_id", options.ownerId)
  }

  if (options?.search) {
    query = query.ilike("title", `%${options.search}%`)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching question sets:", error)
    return []
  }

  return data || []
}

export async function getPublicQuestionSets(options?: {
  limit?: number
  offset?: number
  search?: string
}): Promise<QuestionSet[]> {
  return getQuestionSets({
    ...options,
    visibility: "public",
  })
}

export async function getMyQuestionSets(userId: string, options?: {
  limit?: number
  offset?: number
  search?: string
}): Promise<QuestionSet[]> {
  return getQuestionSets({
    ...options,
    ownerId: userId,
  })
}

export async function getQuestionSetById(id: string): Promise<QuestionSet | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("question_sets")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching question set:", error)
    return null
  }

  return data
}

export async function createQuestionSet(
  userId: string,
  input: CreateQuestionSetInput
): Promise<QuestionSet | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("question_sets")
    .insert({
      owner_id: userId,
      title: input.title,
      description: input.description || null,
      visibility: input.visibility || "private",
      cover_image: input.cover_image || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating question set:", error)
    return null
  }

  return data
}

export async function updateQuestionSet(
  id: string,
  input: UpdateQuestionSetInput
): Promise<QuestionSet | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("question_sets")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating question set:", error)
    return null
  }

  return data
}

export async function deleteQuestionSet(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("question_sets")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting question set:", error)
    return false
  }

  return true
}

export async function copyQuestionSet(
  userId: string,
  sourceSetId: string
): Promise<QuestionSet | null> {
  const supabase = createClient()

  // Get the source question set
  const sourceSet = await getQuestionSetById(sourceSetId)
  if (!sourceSet) {
    return null
  }

  // Get all questions from source set
  const questions = await getQuestionsBySetId(sourceSetId)

  // Create new question set
  const newSet = await createQuestionSet(userId, {
    title: `${sourceSet.title} (Copy)`,
    description: sourceSet.description || undefined,
    visibility: "private",
    cover_image: sourceSet.cover_image || undefined,
  })

  if (!newSet) {
    return null
  }

  // Update copied_from reference
  await supabase
    .from("question_sets")
    .update({ copied_from: sourceSetId })
    .eq("id", newSet.id)

  // Increment copy_count on source
  await supabase
    .from("question_sets")
    .update({ copy_count: sourceSet.copy_count + 1 })
    .eq("id", sourceSetId)

  // Copy all questions
  if (questions.length > 0) {
    const newQuestions = questions.map((q, index) => ({
      question_set_id: newSet.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      topic: q.topic,
      order_index: index,
    }))

    await supabase.from("questions").insert(newQuestions)
  }

  // Return updated set with correct question count
  return getQuestionSetById(newSet.id)
}

// =====================
// Questions CRUD
// =====================

export async function getQuestionsBySetId(questionSetId: string): Promise<Question[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("question_set_id", questionSetId)
    .order("order_index", { ascending: true })

  if (error) {
    console.error("Error fetching questions:", error)
    return []
  }

  return data || []
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching question:", error)
    return null
  }

  return data
}

export async function createQuestion(
  questionSetId: string,
  input: CreateQuestionInput
): Promise<Question | null> {
  const supabase = createClient()

  // Get current max order_index
  const { data: existing } = await supabase
    .from("questions")
    .select("order_index")
    .eq("question_set_id", questionSetId)
    .order("order_index", { ascending: false })
    .limit(1)

  const nextOrderIndex = input.order_index ?? ((existing?.[0]?.order_index ?? -1) + 1)

  const { data, error } = await supabase
    .from("questions")
    .insert({
      question_set_id: questionSetId,
      question: input.question,
      options: input.options,
      correct_answer: input.correct_answer,
      explanation: input.explanation || null,
      topic: input.topic || null,
      order_index: nextOrderIndex,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating question:", error)
    return null
  }

  return data
}

export async function createManyQuestions(
  questionSetId: string,
  inputs: CreateQuestionInput[]
): Promise<Question[]> {
  const supabase = createClient()

  const questionsToInsert = inputs.map((input, index) => ({
    question_set_id: questionSetId,
    question: input.question,
    options: input.options,
    correct_answer: input.correct_answer,
    explanation: input.explanation || null,
    topic: input.topic || null,
    order_index: input.order_index ?? index,
  }))

  const { data, error } = await supabase
    .from("questions")
    .insert(questionsToInsert)
    .select()

  if (error) {
    console.error("Error creating questions:", error)
    return []
  }

  return data || []
}

export async function updateQuestion(
  id: string,
  input: UpdateQuestionInput
): Promise<Question | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("questions")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating question:", error)
    return null
  }

  return data
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting question:", error)
    return false
  }

  return true
}

export async function reorderQuestions(
  questionSetId: string,
  questionIds: string[]
): Promise<boolean> {
  const supabase = createClient()

  // Update order_index for each question
  const updates = questionIds.map((id, index) => 
    supabase
      .from("questions")
      .update({ order_index: index })
      .eq("id", id)
      .eq("question_set_id", questionSetId)
  )

  try {
    await Promise.all(updates)
    return true
  } catch (error) {
    console.error("Error reordering questions:", error)
    return false
  }
}

// =====================
// Helper Functions
// =====================

export function getShareUrl(questionSetId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/sets/${questionSetId}`
  }
  return `/sets/${questionSetId}`
}

export function getTopicsFromQuestions(questions: Question[]): string[] {
  const topics = new Set<string>()
  questions.forEach((q) => {
    if (q.topic) {
      topics.add(q.topic)
    }
  })
  return Array.from(topics)
}

