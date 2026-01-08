/**
 * Hook for fetching and managing quiz data
 */

import { useEffect } from 'react'
import { useQuizStore } from '@/lib/stores/quiz-store'
import type { FullQuiz } from '@/lib/types/quiz'

interface UseFormQuizOptions {
  quizId?: string
  autoFetch?: boolean
}

export function useFormQuiz(options: UseFormQuizOptions = {}) {
  const { quizId, autoFetch = true } = options

  const {
    currentQuiz,
    isLoading,
    error,
    fetchQuizData,
    fetchQuizById,
    setCurrentQuiz,
  } = useQuizStore()

  useEffect(() => {
    if (autoFetch) {
      if (quizId) {
        fetchQuizById(quizId)
      } else {
        fetchQuizData()
      }
    }
  }, [quizId, autoFetch, fetchQuizById, fetchQuizData])

  const refreshQuiz = () => {
    if (quizId) {
      fetchQuizById(quizId)
    } else {
      fetchQuizData()
    }
  }

  return {
    quiz: currentQuiz,
    isLoading,
    error,
    refreshQuiz,
    setCurrentQuiz,
  }
}




