import { NextRequest, NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY

const SYSTEM_PROMPT = `You are a question parser. Given raw OCR text from exam/quiz documents, extract and structure the questions into a valid JSON array.

Each question should have:
- "question": The question text (string)
- "options": Array of answer options (strings, minimum 2)
- "correctAnswer": Index of correct answer (number, 0-based). If not indicated, use -1
- "explanation": Explanation if provided (string or empty)
- "topic": Topic/subject if identifiable (string or empty)

Rules:
1. Extract ALL questions found in the text
2. Clean up OCR artifacts (weird characters, broken words)
3. Preserve the original language (Vietnamese or English)
4. If correct answer is marked (with *, ✓, "Đáp án:", etc.), set correctAnswer accordingly
5. If no correct answer is marked, set correctAnswer to -1
6. Return ONLY valid JSON array, no markdown, no explanation

Example output:
[
  {
    "question": "TCP sử dụng cơ chế nào để kiểm soát lưu lượng?",
    "options": ["Flow control", "Congestion control", "Error control", "Cả A và B"],
    "correctAnswer": 3,
    "explanation": "TCP sử dụng cả flow control và congestion control",
    "topic": "TCP/IP"
  }
]`

export async function POST(request: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      )
    }

    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      )
    }

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Parse the following OCR text into structured questions:\n\n${text}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Groq API error:", error)
      return NextResponse.json(
        { error: "Question formatting failed", details: error },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || "[]"

    // Parse the JSON response
    let questions = []
    try {
      const parsed = JSON.parse(content)
      // Handle both direct array and object with questions property
      questions = Array.isArray(parsed) ? parsed : (parsed.questions || [])
    } catch (parseError) {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0])
      } else {
        console.error("Failed to parse questions:", parseError)
        return NextResponse.json(
          { error: "Failed to parse formatted questions" },
          { status: 500 }
        )
      }
    }

    // Validate and clean questions
    const validQuestions = questions
      .filter((q: Record<string, unknown>) => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length >= 2
      )
      .map((q: Record<string, unknown>) => ({
        question: String(q.question).trim(),
        options: (q.options as string[]).map((o: string) => String(o).trim()),
        correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : -1,
        explanation: q.explanation ? String(q.explanation).trim() : "",
        topic: q.topic ? String(q.topic).trim() : "",
      }))

    return NextResponse.json({ questions: validQuestions })
  } catch (error) {
    console.error("Format questions error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}

