"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, Bot, User, Loader2, ImageIcon, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Question } from "@/lib/questions"

interface AIAssistantProps {
  onBack: () => void
  initialQuestion?: Question | null
}

// Pollinations.ai image generation URL
function getPollinationsImageUrl(prompt: string, width = 512, height = 512): string {
  const encodedPrompt = encodeURIComponent(prompt)
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`
}

export function AIAssistant({ onBack, initialQuestion }: AIAssistantProps) {
  const [input, setInput] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [imagePrompt, setImagePrompt] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Send initial question context if provided
  useEffect(() => {
    if (initialQuestion && messages.length === 0) {
      const questionContext = `Tôi đang học câu hỏi sau và cần bạn giải thích chi tiết:

**Câu hỏi:** ${initialQuestion.question}

**Các đáp án:**
${initialQuestion.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n")}

**Đáp án đúng:** ${initialQuestion.correctAnswers.map((i) => String.fromCharCode(65 + i)).join(", ")}

Hãy giải thích tại sao đáp án này đúng và các đáp án khác sai.`

      sendMessage({ text: questionContext })
    }
  }, [initialQuestion, messages.length, sendMessage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput("")
  }

  const generateImage = async (topic: string) => {
    setImageLoading(true)
    setImagePrompt(topic)

    // Create a descriptive prompt for network concepts
    const imagePromptText = `Educational diagram illustration of ${topic} in computer networking, clean technical diagram style, labeled components, professional infographic, white background, no text`

    const imageUrl = getPollinationsImageUrl(imagePromptText, 768, 512)
    setGeneratedImage(imageUrl)
    setImageLoading(false)
  }

  const suggestedTopics = [
    "TCP three-way handshake",
    "OSI model layers",
    "BGP routing protocol",
    "SDN architecture",
    "Docker container networking",
    "IPv6 address structure",
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Assistant
          </h1>
          <p className="text-sm text-muted-foreground">Hỏi đáp về Mạng Máy Tính</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0 flex flex-col h-[600px]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 && !initialQuestion ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Xin chào!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tôi là trợ lý AI giúp bạn học Mạng Máy Tính. Hãy hỏi tôi bất cứ điều gì về TCP, routing, SDN, cloud
                    computing...
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["TCP hoạt động thế nào?", "Giải thích về OSPF", "SDN là gì?"].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() => {
                          sendMessage({ text: suggestion })
                        }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.role === "assistant" && (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2 max-w-[85%]",
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        {message.parts.map((part, index) => {
                          if (part.type === "text") {
                            return (
                              <div key={index} className="whitespace-pre-wrap text-sm">
                                {part.text}
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                      {message.role === "user" && (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="rounded-lg px-4 py-2 bg-muted">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Image Generation Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Tạo hình minh họa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Tạo sơ đồ minh họa để dễ nhớ các khái niệm mạng</p>

            {/* Suggested Topics */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Chủ đề gợi ý:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTopics.map((topic) => (
                  <Button
                    key={topic}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 bg-transparent"
                    onClick={() => generateImage(topic)}
                    disabled={imageLoading}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>

            {/* Generated Image */}
            {(generatedImage || imageLoading) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{imagePrompt}</p>
                  {generatedImage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setGeneratedImage(null)
                        setImagePrompt("")
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="relative aspect-[3/2] rounded-lg overflow-hidden bg-muted">
                  {imageLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : generatedImage ? (
                    <img
                      src={generatedImage || "/placeholder.svg"}
                      alt={imagePrompt}
                      className="w-full h-full object-cover"
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageLoading(false)
                      }}
                    />
                  ) : null}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
