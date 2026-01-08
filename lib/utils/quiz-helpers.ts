/**
 * Utility functions for quiz/form builder
 */

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




