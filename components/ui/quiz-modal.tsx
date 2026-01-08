"use client"

import { useEffect, useState } from "react"
import { useQuizStore } from "@/lib/stores/quiz-store"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { QuizModalContainer } from "./quiz-modal/quiz-modal-container"

interface QuizModalProps {
  quizId: string
  isOpen: boolean
  onClose: () => void
  onOpenBuilder: (quizId: string) => void
}

export function QuizModal({ quizId, isOpen, onClose, onOpenBuilder }: QuizModalProps) {
  const { quizzes, fetchQuizById } = useQuizStore()
  const [isLoading, setIsLoading] = useState(false)

  const quiz = quizzes.find((q) => q.id === quizId)

  useEffect(() => {
    if (isOpen && quizId && !quiz) {
      setIsLoading(true)
      fetchQuizById(quizId).finally(() => setIsLoading(false))
    }
  }, [isOpen, quizId, quiz, fetchQuizById])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : quiz ? (
          <QuizModalContainer
            quiz={quiz}
            onClose={onClose}
            onOpenBuilder={onOpenBuilder}
          />
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Quiz not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}




