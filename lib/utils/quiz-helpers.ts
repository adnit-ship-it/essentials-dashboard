/**
 * Utility functions for quiz/form builder
 */

import type { QuestionType, QuestionOption } from "@/lib/types/quiz"

/**
 * Generate a slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
}

/**
 * Generate a UUID-like ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Generate a temporary ID for local form steps
 */
export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Calculate the next step order for a progress step
 */
export function calculateNextStepOrder(
  formSteps: Array<{ step_order: number }>,
  progressStepId: string,
  stepProgressMapping: Array<{ form_step_id: string; progress_step_id: string }>
): number {
  const stepsInProgressStep = formSteps.filter((fs) => {
    const mapping = stepProgressMapping.find((m) => m.form_step_id === fs.id)
    return mapping?.progress_step_id === progressStepId
  })

  if (stepsInProgressStep.length === 0) {
    return 1
  }

  const maxOrder = Math.max(...stepsInProgressStep.map((fs) => fs.step_order))
  return maxOrder + 1
}

/**
 * Validate quiz data structure
 */
export function validateQuiz(quiz: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!quiz.id) {
    errors.push("Quiz ID is required")
  }

  if (!quiz.name || !quiz.name.trim()) {
    errors.push("Quiz name is required")
  }

  if (!quiz.slug || !quiz.slug.trim()) {
    errors.push("Quiz slug is required")
  }

  if (!quiz.organization_id) {
    errors.push("Organization ID is required")
  }

  if (!Array.isArray(quiz.progressSteps)) {
    errors.push("Progress steps must be an array")
  }

  if (!Array.isArray(quiz.formSteps)) {
    errors.push("Form steps must be an array")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Sort form steps by order
 */
export function sortFormStepsByOrder<T extends { step_order: number }>(
  steps: T[]
): T[] {
  return [...steps].sort((a, b) => a.step_order - b.step_order)
}

/**
 * Get form steps for a specific progress step
 */
export function getFormStepsForProgressStep(
  formSteps: Array<{ id: string }>,
  progressStepId: string,
  stepProgressMapping: Array<{ form_step_id: string; progress_step_id: string }>
) {
  return formSteps.filter((fs) => {
    const mapping = stepProgressMapping.find((m) => m.form_step_id === fs.id)
    return mapping?.progress_step_id === progressStepId
  })
}

/**
 * Get available questions for conditional rendering in a form step
 * Returns questions from prior form steps only (based on progress step order, then step_order)
 */
export function getAvailableQuestionsForFormStep(
  quiz: {
    progressSteps: Array<{ id: string; name: string; step_order: number }>
    formSteps: Array<{ id: string; title: string; step_order: number; questions?: Array<{ id: string; slug: string; question: string; type?: QuestionType; options?: QuestionOption[] }> }>
    stepProgressMapping: Array<{ form_step_id: string; progress_step_id: string }>
  },
  currentFormStepId: string
): Array<{ id: string; slug: string; question: string; progressStepName: string; formStepTitle: string; type: QuestionType; options?: QuestionOption[] }> {
  // Find current form step
  const currentFormStep = quiz.formSteps.find((fs) => fs.id === currentFormStepId)
  if (!currentFormStep) {
    return []
  }

  // Find current form step's progress step
  const currentMapping = quiz.stepProgressMapping.find(
    (m) => m.form_step_id === currentFormStepId
  )
  if (!currentMapping) {
    return []
  }

  const currentProgressStepId = currentMapping.progress_step_id
  const currentProgressStep = quiz.progressSteps.find((ps) => ps.id === currentProgressStepId)
  if (!currentProgressStep) {
    return []
  }

  // Sort progress steps by order
  const sortedProgressSteps = [...quiz.progressSteps].sort(
    (a, b) => a.step_order - b.step_order
  )

  // Find current progress step index
  const currentProgressStepIndex = sortedProgressSteps.findIndex(
    (ps) => ps.id === currentProgressStepId
  )

  if (currentProgressStepIndex === -1) {
    return []
  }

  const availableQuestions: Array<{
    id: string
    slug: string
    question: string
    progressStepName: string
    formStepTitle: string
    type: QuestionType
    options?: QuestionOption[]
  }> = []

  // Collect questions from previous progress steps (all form steps)
  for (let i = 0; i < currentProgressStepIndex; i++) {
    const progressStep = sortedProgressSteps[i]
    const formStepsInProgressStep = quiz.formSteps.filter((fs) => {
      const mapping = quiz.stepProgressMapping.find((m) => m.form_step_id === fs.id)
      return mapping?.progress_step_id === progressStep.id
    })

    formStepsInProgressStep.forEach((formStep) => {
      if (formStep.questions) {
        formStep.questions.forEach((question) => {
          availableQuestions.push({
            id: question.id,
            slug: question.slug,
            question: question.question,
            progressStepName: progressStep.name,
            formStepTitle: formStep.title,
            type: question.type || "TEXT" as QuestionType,
            options: question.options,
          })
        })
      }
    })
  }

  // Collect questions from current progress step with lower step_order
  // First, get all form steps in the current progress step and sort them
  const allFormStepsInCurrentProgressStep = quiz.formSteps
    .filter((fs) => {
      const mapping = quiz.stepProgressMapping.find((m) => m.form_step_id === fs.id)
      return mapping?.progress_step_id === currentProgressStepId
    })
    .sort((a, b) => a.step_order - b.step_order)

  // Find the current form step's index in the sorted list
  const currentStepIndex = allFormStepsInCurrentProgressStep.findIndex(
    (fs) => fs.id === currentFormStepId
  )

  // Include all form steps that come before the current one
  if (currentStepIndex > 0) {
    const previousSteps = allFormStepsInCurrentProgressStep.slice(0, currentStepIndex)
    previousSteps.forEach((formStep) => {
      if (formStep.questions) {
        formStep.questions.forEach((question) => {
          availableQuestions.push({
            id: question.id,
            slug: question.slug,
            question: question.question,
            progressStepName: currentProgressStep.name,
            formStepTitle: formStep.title,
            type: question.type || "TEXT" as QuestionType,
            options: question.options,
          })
        })
      }
    })
  }

  return availableQuestions
}

/**
 * Validate conditional rendering conditions
 */
export function validateConditionalRendering(
  quiz: {
    progressSteps: Array<{ id: string; name: string; step_order: number }>
    formSteps: Array<{ id: string; title: string; step_order: number; questions?: Array<{ id: string; slug: string }> }>
    stepProgressMapping: Array<{ form_step_id: string; progress_step_id: string }>
  },
  formStepId: string,
  condition: { conditions: Array<{ field: string }> } | null
): { valid: boolean; errors: string[] } {
  if (!condition || !condition.conditions || condition.conditions.length === 0) {
    return { valid: true, errors: [] }
  }

  const availableQuestions = getAvailableQuestionsForFormStep(quiz, formStepId)
  const availableSlugs = new Set(availableQuestions.map((q) => q.slug))

  const errors: string[] = []

  condition.conditions.forEach((cond, index) => {
    if (!availableSlugs.has(cond.field)) {
      // Find which form step this question belongs to for better error message
      const allQuestions = quiz.formSteps.flatMap((fs) =>
        (fs.questions || []).map((q) => ({
          slug: q.slug,
          formStepId: fs.id,
          formStepTitle: fs.title,
        }))
      )
      const questionInfo = allQuestions.find((q) => q.slug === cond.field)

      if (questionInfo) {
        errors.push(
          `Condition ${index + 1}: Question "${cond.field}" is from a future or current form step and cannot be referenced.`
        )
      } else {
        errors.push(`Condition ${index + 1}: Question "${cond.field}" not found in available questions.`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}




