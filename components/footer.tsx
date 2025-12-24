"use client"

import { Github, ExternalLink, Heart } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/language-context"

export function Footer() {
  const t = useTranslation()
  
  return (
    <footer className="border-t mt-auto">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Main CTA */}
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {t.footer.enjoying} <Heart className="inline-block h-5 w-5 text-red-500 animate-pulse" />
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              {t.footer.helpful}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="https://github.com/newnol"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-accent transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="font-medium">{t.footer.followGithub}</span>
            </Link>
            <Link
              href="https://newnol.io.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              <span className="font-medium">{t.footer.visitWebsite}</span>
            </Link>
          </div>

          {/* Bottom credits */}
          <div className="text-sm text-muted-foreground pt-4 border-t w-full">
            <p>
              {t.footer.builtWith}{" "}
              <Link 
                href="https://newnol.io.vn" 
                target="_blank"
                className="underline hover:text-foreground transition-colors"
              >
                Newnol
              </Link>
              {" "}• {t.footer.openSource}{" "}
              <Link 
                href="https://github.com/newnol/quizly" 
                target="_blank"
                className="underline hover:text-foreground transition-colors"
              >
                GitHub
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

