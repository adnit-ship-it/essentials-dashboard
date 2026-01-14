/**
 * Hook for managing local form state and changes
 */

import { useMemo } from 'react'
import { useQuizStore } from '@/lib/stores/quiz-store'
import type {
  FullQuiz,
  LocalFormStep,
  AddedTemplateStep,
  UpdatedFormStep,
  ReorderOperation,
  BatchSaveRequest,
  ProgressStep,
  Question,
} from '@/lib/types/quiz'
import { validateConditionalRendering } from '@/lib/utils/quiz-helpers'

interface UseFormLocalStateOptions {
  quiz: FullQuiz | null
}

export function useFormLocalState(options: UseFormLocalStateOptions) {
  const { quiz } = options

  const {
    data,
    originalData,
    hasPendingChanges,
    updateQuizDraft,
    addFormStep,
    updateFormStep,
    deleteFormStep,
    reorderFormStep,
    reorderProgressStep,
    addProgressStep,
    saveQuizChanges,
    resetDraft,
  } = useQuizStore()

  const localQuiz = useMemo(() => {
    if (!quiz || !data) return null
    return data.quizzes.find((q) => q.id === quiz.id) || quiz
  }, [quiz, data])

  const originalQuiz = useMemo(() => {
    if (!quiz || !originalData) return quiz
    return originalData.quizzes.find((q) => q.id === quiz.id) || quiz
  }, [quiz, originalData])

  const handleAddNewFormStep = (step: LocalFormStep) => {
    if (!quiz) return
    addFormStep(quiz.id, step)
  }

  const handleUpdateFormStep = (stepId: string, updates: Partial<UpdatedFormStep>) => {
    if (!quiz) return
    updateFormStep(quiz.id, stepId, updates)
  }

  const handleDeleteFormStep = (stepId: string) => {
    if (!quiz) return
    deleteFormStep(quiz.id, stepId)
  }

  const handleReorderFormStep = (
    stepId: string,
    newOrder: number,
    newProgressStepId: string,
    oldProgressStepId: string
  ) => {
    if (!quiz) return
    reorderFormStep(quiz.id, stepId, newOrder, newProgressStepId, oldProgressStepId)
  }

  const handleReorderProgressStep = (progressStepId: string, newOrder: number) => {
    if (!quiz) return
    reorderProgressStep(quiz.id, progressStepId, newOrder)
  }

  const handleAddProgressStep = (step: Omit<ProgressStep, 'id' | 'order'>) => {
    if (!quiz) return
    addProgressStep(quiz.id, step)
  }

  const handleSaveChanges = async (changes: BatchSaveRequest) => {
    if (!quiz) return
    await saveQuizChanges(quiz.id, changes)
  }

  /**
   * Collects all changes by comparing draft state with original
   */
  const collectChanges = (): BatchSaveRequest | null => {
    if (!localQuiz || !originalQuiz) {
      console.log("collectChanges: Missing localQuiz or originalQuiz", { localQuiz: !!localQuiz, originalQuiz: !!originalQuiz })
      return null
    }

    console.log("=== COLLECT CHANGES: Starting ===")
    console.log("Original Quiz ID:", originalQuiz.id)
    console.log("Local Quiz ID:", localQuiz.id)
    console.log("Original Progress Steps Count:", originalQuiz.progressSteps?.length || 0)
    console.log("Local Progress Steps Count:", localQuiz.progressSteps?.length || 0)
    console.log("Original Progress Steps:", originalQuiz.progressSteps?.map(ps => ({ id: ps.id, name: ps.name, order: ps.order })) || [])
    console.log("Local Progress Steps:", localQuiz.progressSteps?.map(ps => ({ id: ps.id, name: ps.name, order: ps.order })) || [])
    
    // Sort both for comparison
    const originalSorted = [...(originalQuiz.progressSteps || [])].sort((a, b) => a.order - b.order)
    const localSorted = [...(localQuiz.progressSteps || [])].sort((a, b) => a.order - b.order)
    console.log("Original Sorted:", originalSorted.map(ps => ({ id: ps.id, name: ps.name, order: ps.order })))
    console.log("Local Sorted:", localSorted.map(ps => ({ id: ps.id, name: ps.name, order: ps.order })))
    
    // Compare order
    const orderDifferences = originalSorted.map((ops, idx) => {
      const lps = localSorted.find(ps => ps.id === ops.id)
      return {
        id: ops.id,
        name: ops.name,
        originalOrder: ops.order,
        localOrder: lps?.order,
        orderChanged: lps && lps.order !== ops.order,
        indexChanged: lps && localSorted.findIndex(ps => ps.id === ops.id) !== idx
      }
    })
    console.log("Order Differences:", orderDifferences)

    const changes: BatchSaveRequest = {
      newFormSteps: [],
      addedTemplateSteps: [],
      updatedFormSteps: [],
      reorderOperations: [],
      deletedFormStepIds: [],
      newProgressSteps: [],
      updatedProgressSteps: [],
      reorderProgressOperations: [],
    }

    // Helper to normalize questions for comparison (sort by order, remove IDs for comparison)
    const normalizeQuestions = (questions: Question[] | undefined) => {
      if (!questions) return []
      return [...questions]
        .sort((a, b) => a.question_order - b.question_order)
        .map((q) => ({
          ...q,
          id: '', // Remove ID for comparison
        }))
    }

    // Collect form step changes
    const originalFormSteps = originalQuiz.formSteps || []
    const localFormSteps = localQuiz.formSteps || []

    // Find new form steps (temp IDs)
    localFormSteps.forEach((localStep) => {
      if (localStep.id.startsWith('temp-')) {
        changes.newFormSteps.push({
          ...localStep,
        } as LocalFormStep)
      }
    })

    // Find deleted form steps
    originalFormSteps.forEach((originalStep) => {
      const exists = localFormSteps.some((fs) => fs.id === originalStep.id)
      if (!exists && !originalStep.id.startsWith('temp-')) {
        changes.deletedFormStepIds.push(originalStep.id)
      }
    })

    // Find updated form steps and reorder operations
    localFormSteps.forEach((localStep) => {
      if (localStep.id.startsWith('temp-')) return // Already handled as new

      const originalStep = originalFormSteps.find((fs) => fs.id === localStep.id)
      if (!originalStep) return

      // Check for reorder (order or progressStepId changed)
      const stepOrderChanged = localStep.order !== originalStep.order
      const progressStepChanged = localStep.progressStepId !== originalStep.progressStepId

      if (stepOrderChanged || progressStepChanged) {
        changes.reorderOperations.push({
          formStepId: localStep.id,
          newOrder: localStep.order,
          newProgressStepId: localStep.progressStepId,
          oldProgressStepId: originalStep.progressStepId,
        })
      }

      // Check for content updates (title, heading1, subtext, questions, render_condition)
      const titleChanged = localStep.title !== originalStep.title
      const heading1Changed = localStep.heading1 !== originalStep.heading1
      const subtextChanged = localStep.subtext !== originalStep.subtext
      const renderConditionChanged =
        JSON.stringify(localStep.render_condition) !==
        JSON.stringify(originalStep.render_condition)

      // Compare questions (check content and order)
      const originalQuestions = originalStep.questions || []
      const localQuestions = localStep.questions || []
      
      // Check if questions changed (content, order, or count)
      const questionsChanged =
        originalQuestions.length !== localQuestions.length ||
        // Check for new or deleted questions
        localQuestions.some((lq) => !originalQuestions.find((oq) => oq.id === lq.id)) ||
        originalQuestions.some((oq) => !localQuestions.find((lq) => lq.id === oq.id)) ||
        // Check if content changed
        originalQuestions.some((oq) => {
          const lq = localQuestions.find((q) => q.id === oq.id)
          if (!lq) return false // Already handled above
          // Compare key fields
          return (
            oq.question !== lq.question ||
            oq.type !== lq.type ||
            oq.required !== lq.required ||
            oq.slug !== lq.slug ||
            oq.displayQuestion !== lq.displayQuestion ||
            oq.placeholder !== lq.placeholder ||
            JSON.stringify(oq.validation) !== JSON.stringify(lq.validation) ||
            oq.api_type !== lq.api_type
          )
        }) ||
        // Check if order changed by comparing IDs in order
        originalQuestions.some((oq, origIndex) => {
          const localIndex = localQuestions.findIndex((lq) => lq.id === oq.id)
          return localIndex !== origIndex && localIndex !== -1
        })

      if (
        titleChanged ||
        heading1Changed ||
        subtextChanged ||
        questionsChanged ||
        renderConditionChanged
      ) {
        // Validate conditional rendering if it changed
        if (renderConditionChanged && localStep.render_condition) {
          const validation = validateConditionalRendering(
            localQuiz,
            localStep.id,
            localStep.render_condition
          )
          if (!validation.valid) {
            console.warn(
              `Form step "${localStep.title}" has invalid conditional rendering:`,
              validation.errors
            )
            // Still allow saving but log warnings
          }
        }

        // Recalculate question orders for updated questions (sort by current order first)
        const sortedQuestions = [...(localStep.questions || [])].sort(
          (a, b) => a.question_order - b.question_order
        )
        const questionsWithOrder = sortedQuestions.map((q, index) => ({
          ...q,
          question_order: index + 1,
        }))

        changes.updatedFormSteps.push({
          id: localStep.id,
          title: localStep.title,
          heading1: localStep.heading1,
          subtext: localStep.subtext,
          render_condition: localStep.render_condition,
          questions: questionsWithOrder,
        })
      }
    })

    // Collect progress step changes
    const originalProgressSteps = [...(originalQuiz.progressSteps || [])].sort(
      (a, b) => a.order - b.order
    )
    const localProgressSteps = [...(localQuiz.progressSteps || [])].sort(
      (a, b) => a.order - b.order
    )

    // Find new progress steps (temp IDs or not in original)
    localProgressSteps.forEach((localPs) => {
      const isTempId = localPs.id.startsWith('temp-progress-')
      const existsInOriginal = originalProgressSteps.some((ps) => ps.id === localPs.id)
      if (isTempId || !existsInOriginal) {
        changes.newProgressSteps?.push({
          slug: localPs.slug,
          name: localPs.name,
          description: localPs.description,
          color: localPs.color,
          order: localPs.order,
          tempId: isTempId ? localPs.id : undefined,
        })
      }
    })

    // Find updated and reordered progress steps
    localProgressSteps.forEach((localPs) => {
      const originalPs = originalProgressSteps.find((ps) => ps.id === localPs.id)
      if (!originalPs) {
        console.log(`Progress step ${localPs.id} not found in original - already handled as new`)
        return // New progress step, already handled
      }

      // Check for reorder
      if (localPs.order !== originalPs.order) {
        console.log(`Progress step ${localPs.id} reordered: ${originalPs.order} -> ${localPs.order}`)
        changes.reorderProgressOperations?.push({
          progressStepId: localPs.id,
          newOrder: localPs.order,
        })
      }

      // Check for updates (name, description, color)
      const nameChanged = localPs.name !== originalPs.name
      const descriptionChanged = localPs.description !== originalPs.description
      const colorChanged = localPs.color !== originalPs.color

      if (nameChanged || descriptionChanged || colorChanged) {
        console.log(`Progress step ${localPs.id} updated:`, {
          name: nameChanged ? `${originalPs.name} -> ${localPs.name}` : 'unchanged',
          description: descriptionChanged ? 'changed' : 'unchanged',
          color: colorChanged ? `${originalPs.color} -> ${localPs.color}` : 'unchanged',
        })
        changes.updatedProgressSteps?.push({
          id: localPs.id,
          name: localPs.name,
          description: localPs.description,
          color: localPs.color,
        } as Partial<ProgressStep> & { id: string })
      }
    })

    console.log("=== COLLECT CHANGES: Summary ===")
    console.log("Reorder Progress Operations:", changes.reorderProgressOperations?.length || 0)
    console.log("Updated Progress Steps:", changes.updatedProgressSteps?.length || 0)
    console.log("New Progress Steps:", changes.newProgressSteps?.length || 0)

    return changes
  }

  return {
    localQuiz,
    originalQuiz,
    hasUnsavedChanges: hasPendingChanges,
    addNewFormStep: handleAddNewFormStep,
    updateFormStep: handleUpdateFormStep,
    deleteFormStep: handleDeleteFormStep,
    reorderFormStep: handleReorderFormStep,
    reorderProgressStep: handleReorderProgressStep,
    addProgressStep: handleAddProgressStep,
    collectChanges,
    saveChanges: handleSaveChanges,
    resetChanges: resetDraft,
  }
}




