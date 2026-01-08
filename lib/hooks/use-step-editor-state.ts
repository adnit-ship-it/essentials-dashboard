/**
 * Hook for managing step-level editing state
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import type { QuizFormStep, UpdatedFormStep } from '@/lib/types/quiz'

interface UseStepEditorStateOptions {
  step: QuizFormStep | null
  onStepSave?: (updates: UpdatedFormStep) => Promise<void>
}

export function useStepEditorState(options: UseStepEditorStateOptions) {
  const { step, onStepSave } = options

  const [localStep, setLocalStep] = useState<QuizFormStep | null>(step)

  // Update local step when prop changes
  useEffect(() => {
    setLocalStep(step)
  }, [step])

  const hasUnsavedChanges = useMemo(() => {
    if (!step || !localStep) return false
    return JSON.stringify(step) !== JSON.stringify(localStep)
  }, [step, localStep])

  const updateLocalStep = useCallback((updates: Partial<QuizFormStep>) => {
    setLocalStep((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  const saveStep = useCallback(async () => {
    if (!localStep || !onStepSave) return

    const updates: UpdatedFormStep = {
      id: localStep.id,
      title: localStep.title,
      heading1: localStep.heading1,
      subtext: localStep.subtext,
      render_condition: localStep.render_condition,
      questions: localStep.questions,
    }

    await onStepSave(updates)
  }, [localStep, onStepSave])

  const resetChanges = useCallback(() => {
    setLocalStep(step)
  }, [step])

  return {
    localStep,
    hasUnsavedChanges,
    updateLocalStep,
    saveStep,
    resetChanges,
  }
}

