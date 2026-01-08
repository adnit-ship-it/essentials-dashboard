/**
 * Hook for managing selected form step state
 */

import { useState, useCallback } from 'react'
import type { QuizFormStep } from '@/lib/types/quiz'

export function useFormStepSelection() {
  const [selectedStep, setSelectedStep] = useState<QuizFormStep | null>(null)

  const selectStep = useCallback((step: QuizFormStep | null) => {
    setSelectedStep(step)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedStep(null)
  }, [])

  return {
    selectedStep,
    selectStep,
    clearSelection,
  }
}




