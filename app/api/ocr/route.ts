import { NextRequest, NextResponse } from "next/server"
import { Mistral } from "@mistralai/mistralai"
import mammoth from "mammoth"
import { env } from "@/lib/env"

// DOCX MIME types
const DOCX_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Check if file is DOCX
function isDocxFile(mimeType: string, fileName: string): boolean {
  return (
    DOCX_MIME_TYPES.includes(mimeType) ||
    fileName.toLowerCase().endsWith(".docx") ||
    fileName.toLowerCase().endsWith(".doc")
  )
}

// Check if file is PDF
function isPdfFile(mimeType: string, fileName: string): boolean {
  return mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")
}

// Check if file is image
function isImageFile(mimeType: string, fileName: string): boolean {
  return (
    mimeType.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|bmp|tiff?)$/i.test(fileName)
  )
}

export async function POST(request: NextRequest) {
  try {
    if (!env.MISTRAL_API_KEY) {
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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = file.type || ""
    const fileName = file.name || ""

    // Handle DOCX files - extract text directly using mammoth
    if (isDocxFile(mimeType, fileName)) {
      try {
        const result = await mammoth.extractRawText({ buffer })
        const extractedText = result.value

        if (!extractedText.trim()) {
          return NextResponse.json(
            { error: "Không thể đọc text từ file Word. File có thể trống." },
            { status: 400 }
          )
        }

        return NextResponse.json({ text: extractedText.trim() })
      } catch (docxError) {
        console.error("DOCX parse error:", docxError)
        return NextResponse.json(
          { error: "Lỗi đọc file Word: " + (docxError instanceof Error ? docxError.message : String(docxError)) },
          { status: 400 }
        )
      }
    }

    let documentMimeType: string

    if (isPdfFile(mimeType, fileName)) {
      documentMimeType = "application/pdf"
    } else if (isImageFile(mimeType, fileName)) {
      // Default to jpeg if mime type is not recognized
      documentMimeType = mimeType.startsWith("image/") ? mimeType : "image/jpeg"
    } else {
      return NextResponse.json(
        { 
          error: `Định dạng không hỗ trợ: ${mimeType || fileName}. Hãy dùng PDF, Word (DOCX), hoặc ảnh (JPG, PNG, GIF, WebP).` 
        },
        { status: 400 }
      )
    }

    // Convert to base64
    const base64File = buffer.toString("base64")
    const dataUrl = `data:${documentMimeType};base64,${base64File}`

    // Use Mistral OCR API
    const client = new Mistral({ apiKey: env.MISTRAL_API_KEY })

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
      { error: "Lỗi xử lý file: " + errorMessage },
      { status: 500 }
    )
  }
}
