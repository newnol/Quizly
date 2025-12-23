"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type QuestionSet } from "@/lib/question-sets"
import { BookOpen, Copy, Eye, Globe, Lock, Link2, MoreVertical, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface QuestionSetCardProps {
  questionSet: QuestionSet
  isOwner?: boolean
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onCopy?: () => void
  showActions?: boolean
}

export function QuestionSetCard({
  questionSet,
  isOwner = false,
  onView,
  onEdit,
  onDelete,
  onCopy,
  showActions = true,
}: QuestionSetCardProps) {
  const visibilityIcon = {
    public: <Globe className="h-3 w-3" />,
    private: <Lock className="h-3 w-3" />,
    unlisted: <Link2 className="h-3 w-3" />,
  }

  const visibilityLabel = {
    public: "Công khai",
    private: "Riêng tư",
    unlisted: "Có link",
  }

  return (
    <Card 
      className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
      onClick={onView}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">{questionSet.title}</CardTitle>
            {questionSet.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {questionSet.description}
              </CardDescription>
            )}
          </div>
          {showActions && (isOwner || onCopy) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chi tiết
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa
                    </DropdownMenuItem>
                  </>
                )}
                {!isOwner && onCopy && (
                  <DropdownMenuItem onClick={onCopy}>
                    <Copy className="h-4 w-4 mr-2" />
                    Sao chép về của tôi
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{questionSet.question_count} câu hỏi</span>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            {visibilityIcon[questionSet.visibility]}
            {visibilityLabel[questionSet.visibility]}
          </Badge>
        </div>
        {questionSet.copy_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Copy className="h-3 w-3" />
            <span>{questionSet.copy_count} lượt sao chép</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

