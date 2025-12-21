"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { UserProgress } from "@/lib/storage"
import { questions, topics } from "@/lib/questions"

interface TopicProgressProps {
  progress: UserProgress
}

export function TopicProgress({ progress }: TopicProgressProps) {
  const topicStats = topics.map((topic) => {
    const topicQuestions = questions.filter((q) => q.topic === topic)
    const answered = topicQuestions.filter((q) => progress.cardProgress[q.id]).length
    const correct = topicQuestions.filter((q) => {
      const card = progress.cardProgress[q.id]
      return card && card.repetitions > 0
    }).length

    return {
      topic,
      total: topicQuestions.length,
      answered,
      correct,
      percentage: Math.round((answered / topicQuestions.length) * 100),
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tiến độ theo chủ đề</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topicStats.map((stat) => (
          <div key={stat.topic} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{stat.topic}</span>
              <span className="text-muted-foreground">
                {stat.answered}/{stat.total}
              </span>
            </div>
            <Progress value={stat.percentage} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
