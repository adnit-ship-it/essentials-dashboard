/**
 * Quiz service for fetching and saving quiz.json data
 */

import type {
  QuizFileStructure,
  FullQuiz,
  BatchSaveRequest,
  CreateQuizRequest,
  QuizServiceError,
  QuizErrorType,
  ProgressStep,
  QuizFormStep,
  LocalFormStep,
  AddedTemplateStep,
  UpdatedFormStep,
  ReorderOperation,
} from '@/lib/types/quiz'

// Use relative URLs in browser to avoid CORS issues
const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")

export interface QuizDataResponse {
  data: QuizFileStructure
  sha: string
}

export interface QuizResponse {
  quiz: FullQuiz
  sha: string
}

/**
 * Creates a structured error
 */
function createQuizError(
  message: string,
  type: QuizErrorType,
  statusCode?: number
): QuizServiceError {
  return {
    type,
    message,
    statusCode,
  }
}

/**
 * Fetches quiz.json data from the API
 */
export async function fetchQuizData(
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<QuizDataResponse> {
  if (!owner || !repo) {
    throw createQuizError(
      "Repository owner/name missing. Configure via repository settings.",
      'repo_not_found'
    )
  }

  const url = `${API_BASE_URL}/api/quiz?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const errorMessage = error.error || `Failed to fetch quiz data: ${response.status} ${response.statusText}`
    
    let errorType: QuizErrorType = 'unknown_error'
    if (response.status === 404) {
      // File doesn't exist - return empty structure
      return {
        data: {
          quizzes: [],
          templates: [],
          metadata: {
            version: "1.0.0",
            lastUpdated: new Date().toISOString(),
          },
        },
        sha: '',
      }
    } else if (response.status === 403) {
      errorType = 'permission_error'
    } else if (response.status >= 500) {
      errorType = 'network_error'
    }
    
    throw createQuizError(errorMessage, errorType, response.status)
  }

  const data = await response.json()
  return {
    data: data.data || {
      quizzes: [],
      templates: [],
      metadata: {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
      },
    },
    sha: data.sha || "",
  }
}

/**
 * Fetches a single quiz by ID
 */
export async function fetchQuizById(
  owner: string,
  repo: string,
  branch: string,
  quizId: string
): Promise<QuizResponse> {
  if (!owner || !repo) {
    throw createQuizError(
      "Repository owner/name missing. Configure via repository settings.",
      'repo_not_found'
    )
  }

  const url = `${API_BASE_URL}/api/quiz/${encodeURIComponent(quizId)}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const errorMessage = error.error || `Failed to fetch quiz: ${response.status} ${response.statusText}`
    
    let errorType: QuizErrorType = 'unknown_error'
    if (response.status === 404) {
      errorType = 'file_not_found'
    } else if (response.status === 403) {
      errorType = 'permission_error'
    } else if (response.status >= 500) {
      errorType = 'network_error'
    }
    
    throw createQuizError(errorMessage, errorType, response.status)
  }

  const data = await response.json()
  return {
    quiz: data.quiz,
    sha: data.sha || "",
  }
}

/**
 * Creates default progress steps for a new quiz
 */
function createDefaultProgressSteps(quizId: string): ProgressStep[] {
  return [
    {
      id: `progress-${Date.now()}-1`,
      quiz_id: quizId,
      slug: 'information',
      name: 'Information',
      description: 'Provide your information',
      color: '#3B82F6',
      step_order: 1,
    },
  ]
}

/**
 * Creates a new quiz
 */
export async function createQuiz(
  owner: string,
  repo: string,
  branch: string,
  quizData: CreateQuizRequest
): Promise<QuizResponse> {
  if (!owner || !repo) {
    throw createQuizError(
      "Repository owner/name missing. Configure via repository settings.",
      'repo_not_found'
    )
  }

  const url = `${API_BASE_URL}/api/quiz?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(quizData),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const errorMessage = error.error || `Failed to create quiz: ${response.status} ${response.statusText}`
    
    let errorType: QuizErrorType = 'unknown_error'
    if (response.status === 409) {
      errorType = 'conflict_error'
    } else if (response.status === 400) {
      errorType = 'validation_error'
    } else if (response.status >= 500) {
      errorType = 'network_error'
    }
    
    throw createQuizError(errorMessage, errorType, response.status)
  }

  const data = await response.json()
  return {
    quiz: data.quiz,
    sha: data.sha || "",
  }
}

/**
 * Applies batch changes to a quiz in memory
 */
export function applyBatchChangesToQuiz(
  quiz: FullQuiz,
  changes: BatchSaveRequest
): FullQuiz {
  let updatedQuiz = { ...quiz }
  const updatedFormSteps = [...quiz.formSteps]
  const updatedMapping = [...quiz.quizFormStepMapping]
  const updatedStepProgressMapping = [...quiz.stepProgressMapping]
  let updatedProgressSteps = [...quiz.progressSteps]

  // Handle progress step changes first (before form step changes that depend on them)
  
  // Track mapping of temp progress step IDs to new IDs
  const progressStepIdMap = new Map<string, string>()
  
  // Handle new progress steps
  if (changes.newProgressSteps && changes.newProgressSteps.length > 0) {
    changes.newProgressSteps.forEach((newPs) => {
      const tempId = newPs.tempId
      
      const newProgressStep: ProgressStep = {
        id: `progress-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        quiz_id: quiz.id,
        step_order: newPs.step_order,
        slug: newPs.slug,
        name: newPs.name,
        description: newPs.description,
        color: newPs.color,
      }
      updatedProgressSteps.push(newProgressStep)
      
      // Map temp ID to new ID if provided
      if (tempId && tempId.startsWith('temp-progress-')) {
        progressStepIdMap.set(tempId, newProgressStep.id)
      }
    })
  }

  // Handle updated progress steps
  if (changes.updatedProgressSteps && changes.updatedProgressSteps.length > 0) {
    changes.updatedProgressSteps.forEach((updatedPs) => {
      const index = updatedProgressSteps.findIndex((ps) => ps.id === updatedPs.id)
      if (index !== -1) {
        updatedProgressSteps[index] = {
          ...updatedProgressSteps[index],
          ...updatedPs,
        }
      }
    })
  }

  // Handle progress step reordering
  if (changes.reorderProgressOperations && changes.reorderProgressOperations.length > 0) {
    // Sort progress steps by current order
    const sortedProgressSteps = [...updatedProgressSteps].sort(
      (a, b) => a.step_order - b.step_order
    )

    // Apply reorder operations
    changes.reorderProgressOperations.forEach((reorderOp) => {
      const draggedStep = sortedProgressSteps.find((ps) => ps.id === reorderOp.progressStepId)
      if (!draggedStep) return

      // Remove dragged step from array
      const withoutDragged = sortedProgressSteps.filter((ps) => ps.id !== reorderOp.progressStepId)
      
      // Insert at new position
      const newIndex = Math.max(0, Math.min(reorderOp.newOrder - 1, withoutDragged.length))
      withoutDragged.splice(newIndex, 0, draggedStep)

      // Recalculate orders based on new positions
      updatedProgressSteps = updatedProgressSteps.map((ps) => {
        const newIndex = withoutDragged.findIndex((p) => p.id === ps.id)
        return {
          ...ps,
          step_order: newIndex >= 0 ? newIndex + 1 : ps.step_order,
        }
      })
    })
  }

  // Handle deleted form steps
  changes.deletedFormStepIds.forEach((deletedId) => {
    const index = updatedFormSteps.findIndex((fs) => fs.id === deletedId)
    if (index !== -1) {
      updatedFormSteps.splice(index, 1)
    }
    // Remove from mappings
    const mappingIndex = updatedMapping.findIndex((m) => m.form_step_id === deletedId)
    if (mappingIndex !== -1) {
      updatedMapping.splice(mappingIndex, 1)
    }
    const stepMappingIndex = updatedStepProgressMapping.findIndex(
      (m) => m.form_step_id === deletedId
    )
    if (stepMappingIndex !== -1) {
      updatedStepProgressMapping.splice(stepMappingIndex, 1)
    }
  })

  // Handle new form steps
  changes.newFormSteps.forEach((newStep) => {
    const formStep: QuizFormStep = {
      id: newStep.id,
      slug: newStep.slug,
      title: newStep.title,
      heading1: newStep.heading1,
      subtext: newStep.subtext,
      config: newStep.config,
      is_template_step: false,
      render_condition: newStep.render_condition,
      questions: newStep.questions,
      step_order: newStep.step_order,
    }
    updatedFormSteps.push(formStep)
    updatedMapping.push({
      quiz_id: quiz.id,
      form_step_id: formStep.id,
      step_order: formStep.step_order,
    })
    // Map temp progress step ID to new ID if needed
    const progressStepId = progressStepIdMap.get(newStep.progressStepId) || newStep.progressStepId
    updatedStepProgressMapping.push({
      quiz_id: quiz.id,
      form_step_id: formStep.id,
      progress_step_id: progressStepId,
    })
  })

  // Handle added template steps
  changes.addedTemplateSteps.forEach((templateStep) => {
    updatedFormSteps.push(templateStep)
    updatedMapping.push({
      quiz_id: quiz.id,
      form_step_id: templateStep.id,
      step_order: templateStep.step_order,
    })
    updatedStepProgressMapping.push({
      quiz_id: quiz.id,
      form_step_id: templateStep.id,
      progress_step_id: templateStep.progressStepId,
    })
  })

  // Handle updated form steps
  changes.updatedFormSteps.forEach((updatedStep) => {
    const index = updatedFormSteps.findIndex((fs) => fs.id === updatedStep.id)
    if (index !== -1) {
      updatedFormSteps[index] = {
        ...updatedFormSteps[index],
        title: updatedStep.title,
        heading1: updatedStep.heading1,
        subtext: updatedStep.subtext,
        render_condition: updatedStep.render_condition ?? null,
        questions: updatedStep.questions,
      }
    }
  })

  // Handle reorder operations
  changes.reorderOperations.forEach((reorderOp) => {
    const stepIndex = updatedFormSteps.findIndex((fs) => fs.id === reorderOp.formStepId)
    if (stepIndex !== -1) {
      updatedFormSteps[stepIndex].step_order = reorderOp.newStepOrder
    }
    const mappingIndex = updatedMapping.findIndex(
      (m) => m.form_step_id === reorderOp.formStepId
    )
    if (mappingIndex !== -1) {
      updatedMapping[mappingIndex].step_order = reorderOp.newStepOrder
    }
    const stepMappingIndex = updatedStepProgressMapping.findIndex(
      (m) => m.form_step_id === reorderOp.formStepId
    )
    if (stepMappingIndex !== -1) {
      // Map temp progress step ID to new ID if needed
      const progressStepId = progressStepIdMap.get(reorderOp.newProgressStepId) || reorderOp.newProgressStepId
      updatedStepProgressMapping[stepMappingIndex].progress_step_id = progressStepId
    }
  })

  // Sort form steps by order
  updatedFormSteps.sort((a, b) => a.step_order - b.step_order)
  updatedMapping.sort((a, b) => a.step_order - b.step_order)

  // Sort progress steps by order
  updatedProgressSteps.sort((a, b) => a.step_order - b.step_order)

  return {
    ...updatedQuiz,
    progressSteps: updatedProgressSteps,
    formSteps: updatedFormSteps,
    quizFormStepMapping: updatedMapping,
    stepProgressMapping: updatedStepProgressMapping,
  }
}

/**
 * Saves quiz changes via batch save
 */
export async function saveQuizChanges(
  owner: string,
  repo: string,
  branch: string,
  quizId: string,
  changes: BatchSaveRequest,
  sha: string
): Promise<{ newSha: string; quiz: FullQuiz }> {
  if (!owner || !repo) {
    throw createQuizError(
      "Repository owner/name missing. Configure via repository settings.",
      'repo_not_found'
    )
  }

  if (!sha) {
    throw createQuizError(
      "Missing quiz file SHA. Refresh and try again.",
      'validation_error'
    )
  }

  const url = `${API_BASE_URL}/api/quiz/${encodeURIComponent(quizId)}/form-steps/batch-save?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      changes,
      sha,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    
    // Handle 409 Conflict specifically
    if (response.status === 409) {
      throw createQuizError(
        error.error || "The quiz file was modified by someone else. Please refresh and try again.",
        'conflict_error',
        409
      )
    }
    
    let errorType: QuizErrorType = 'unknown_error'
    if (response.status === 400) {
      errorType = 'validation_error'
    } else if (response.status >= 500) {
      errorType = 'network_error'
    }
    
    throw createQuizError(
      error.error || `Failed to save quiz changes: ${response.status} ${response.statusText}`,
      errorType,
      response.status
    )
  }

  const data = await response.json()
  return {
    newSha: data.sha || sha,
    quiz: data.quiz,
  }
}

