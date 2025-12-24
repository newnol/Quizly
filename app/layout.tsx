import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Footer } from "@/components/footer"
import { LanguageProvider } from "@/lib/i18n/language-context"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Quizly - Smart Quiz & Flashcard Learning",
  description: "Create, share and study with AI-powered quizzes. Features spaced repetition, flashcards, and smart learning algorithms.",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quizly",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Quizly",
    title: "Quizly - Smart Quiz & Flashcard Learning",
    description: "Create, share and study with AI-powered quizzes. Features spaced repetition, flashcards, and smart learning algorithms.",
  },
  twitter: {
    card: "summary",
    title: "Quizly - Smart Quiz & Flashcard Learning",
    description: "Create, share and study with AI-powered quizzes. Features spaced repetition, flashcards, and smart learning algorithms.",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7c3aed" },
    { media: "(prefers-color-scheme: dark)", color: "#8b5cf6" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`font-sans antialiased min-h-screen flex flex-col`}>
        <ServiceWorkerRegistration />
        <LanguageProvider>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
