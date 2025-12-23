import { NextRequest, NextResponse } from "next/server"
import { Mistral } from "@mistralai/mistralai"

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY

export async function POST(request: NextRequest) {
  try {
    if (!MISTRAL_API_KEY) {
      return NextResponse.json(
        { error: "MISTRAL_API_KEY is not configured" },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = file.type || ""

    // Determine document type
    let documentMimeType: string
    if (mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      documentMimeType = "application/pdf"
    } else if (mimeType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) {
      documentMimeType = mimeType || "image/jpeg"
    } else {
      return NextResponse.json(
        { error: `Định dạng không hỗ trợ: ${mimeType}. Hãy dùng PDF, JPG, PNG, GIF hoặc WebP.` },
        { status: 400 }
      )
    }

    // Convert to base64
    const base64File = buffer.toString("base64")
    const dataUrl = `data:${documentMimeType};base64,${base64File}`

    // Use Mistral OCR API
    const client = new Mistral({ apiKey: MISTRAL_API_KEY })

    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: dataUrl,
      },
      includeImageBase64: false, // We only need text
    })

    // Extract text from OCR response
    // The response contains pages with markdown content
    let extractedText = ""
    
    if (ocrResponse.pages && Array.isArray(ocrResponse.pages)) {
      for (const page of ocrResponse.pages) {
        if (page.markdown) {
          extractedText += page.markdown + "\n\n"
        }
      }
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "Không thể đọc text từ file. File có thể trống hoặc không hỗ trợ." },
        { status: 400 }
      )
    }

    return NextResponse.json({ text: extractedText.trim() })
  } catch (error) {
    console.error("OCR error:", error)
    
    // Handle specific Mistral errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json(
      { error: "Lỗi OCR: " + errorMessage },
      { status: 500 }
    )
  }
}
