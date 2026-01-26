/**
 * Quiz store for managing quiz.json data
 */

import { create } from "zustand"
import type {
  QuizFileStructure,
  FullQuiz,
  BatchSaveRequest,
  CreateQuizRequest,
  QuizServiceError,
  QuizStoreFeedback,
  LocalFormStep,
  AddedTemplateStep,
  UpdatedFormStep,
  ReorderOperation,
  ProgressStep,
} from "@/lib/types/quiz"
import {
  fetchQuizData,
  fetchQuizById,
  createQuiz as createQuizService,
  saveQuizChanges,
  applyBatchChangesToQuiz,
} from "@/lib/services/quiz"
import { useRepositoryStore } from "./repository-store"
import { useOrganizationStore } from "./organization-store"

interface QuizStore {
  // Original data (from server)
  originalData: QuizFileStructure | null
  data: QuizFileStructure | null // Draft state
  currentQuiz: FullQuiz | null
  quizzes: FullQuiz[] // All quizzes from the selected repo
  sha: string | null

  // View state
  currentView: "list" | "builder"
  builderQuizId: string | null

  // Loading & error states
  isLoading: boolean
  isSaving: boolean
  error: QuizServiceError | null
  hasPendingChanges: boolean
  feedback: QuizStoreFeedback
  hasConflict: boolean

  // Actions
  fetchQuizData: (owner?: string, repo?: string, branch?: string) => Promise<void>
  fetchQuizById: (quizId: string, owner?: string, repo?: string, branch?: string) => Promise<void>
  setCurrentQuiz: (quiz: FullQuiz | null) => void
  setView: (view: "list" | "builder") => void
  setBuilderQuizId: (quizId: string | null) => void

  // Draft operations (no save)
  updateQuizDraft: (updates: (data: QuizFileStructure) => QuizFileStructure) => void
  addFormStep: (quizId: string, step: LocalFormStep) => void
  updateFormStep: (quizId: string, stepId: string, updates: Partial<UpdatedFormStep>) => void
  deleteFormStep: (quizId: string, stepId: string) => void
  reorderFormStep: (
    quizId: string,
    stepId: string,
    newOrder: number,
    newProgressStepId: string,
    oldProgressStepId: string
  ) => void
  reorderProgressStep: (
    quizId: string,
    progressStepId: string,
    newOrder: number
  ) => void
  addProgressStep: (
    quizId: string,
    step: Omit<ProgressStep, 'id' | 'order'>
  ) => void

  // Save operations
  saveQuizChanges: (
    quizId: string,
    changes: BatchSaveRequest,
    owner?: string,
    repo?: string,
    branch?: string
  ) => Promise<void>
  createNewQuiz: (
    quizData: CreateQuizRequest,
    owner?: string,
    repo?: string,
    branch?: string
  ) => Promise<void>

  // Utilities
  resetDraft: () => void
  clearError: () => void
  clearFeedback: () => void
  refreshAndRetry: (
    quizId: string,
    changes: BatchSaveRequest,
    owner?: string,
    repo?: string,
    branch?: string
  ) => Promise<void>
}

/**
 * Get repository info from stores
 */
function getRepoInfo() {
  const repoStore = useRepositoryStore.getState()
  const orgStore = useOrganizationStore.getState()

  // Try repository store first
  if (repoStore.selectedRepoId) {
    const selectedRepo = repoStore.configuredRepos.find(r => r.id === repoStore.selectedRepoId)
    if (selectedRepo) {
      return {
        owner: selectedRepo.owner,
        repo: selectedRepo.repo,
        branch: selectedRepo.defaultBranch || "main",
      }
    }
  }

  // Fallback to organization store
  if (orgStore.repoOwnerFromLink && orgStore.repoNameFromLink) {
    return {
      owner: orgStore.repoOwnerFromLink,
      repo: orgStore.repoNameFromLink,
      branch: "main",
    }
  }

  return null
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  // Initial state
  originalData: null,
  data: null,
  currentQuiz: null,
  quizzes: [],
  sha: null,
  currentView: "list",
  builderQuizId: null,
  isLoading: false,
  isSaving: false,
  error: null,
  hasPendingChanges: false,
  feedback: { type: null, message: null },
  hasConflict: false,

  // Fetch quiz data
  fetchQuizData: async (owner?: string, repo?: string, branch?: string) => {
    const repoInfo = owner && repo
      ? { owner, repo, branch: branch || "main" }
      : getRepoInfo()

    if (!repoInfo) {
      set({
        error: {
          type: "repo_not_found",
          message: "Repository not configured. Please select a repository.",
        },
        isLoading: false,
      })
      return
    }

    set({ isLoading: true, error: null, feedback: { type: null, message: null }, hasConflict: false })

    try {
      const response = await fetchQuizData(repoInfo.owner, repoInfo.repo, repoInfo.branch)

      set({
        originalData: response.data,
        data: response.data,
        quizzes: response.data.quizzes || [],
        sha: response.sha,
        isLoading: false,
        hasPendingChanges: false,
      })
    } catch (err) {
      const error = err as QuizServiceError
      set({
        error,
        isLoading: false,
      })
    }
  },

  // Fetch single quiz by ID
  fetchQuizById: async (quizId: string, owner?: string, repo?: string, branch?: string) => {
    const repoInfo = owner && repo
      ? { owner, repo, branch: branch || "main" }
      : getRepoInfo()

    if (!repoInfo) {
      set({
        error: {
          type: "repo_not_found",
          message: "Repository not configured. Please select a repository.",
        },
        isLoading: false,
      })
      return
    }

    set({ isLoading: true, error: null, feedback: { type: null, message: null } })

    try {
      const response = await fetchQuizById(repoInfo.owner, repoInfo.repo, repoInfo.branch, quizId)

      // Update current quiz and also update in quizzes array for both data and originalData
      const { data, originalData } = get()
      
      // Helper function to update quiz in a data structure
      const updateQuizInData = (dataStructure: QuizFileStructure | null): QuizFileStructure | null => {
        if (!dataStructure) return dataStructure
        const quizIndex = dataStructure.quizzes.findIndex((q) => q.id === quizId)
        const updatedQuizzes = [...dataStructure.quizzes]
        if (quizIndex !== -1) {
          updatedQuizzes[quizIndex] = response.quiz
        } else {
          updatedQuizzes.push(response.quiz)
        }
        return {
          ...dataStructure,
          quizzes: updatedQuizzes,
        }
      }

      const updatedData = updateQuizInData(data)
      const updatedOriginalData = updateQuizInData(originalData)

      set({
        currentQuiz: response.quiz,
        data: updatedData,
        originalData: updatedOriginalData,
        isLoading: false,
      })
    } catch (err) {
      const error = err as QuizServiceError
      set({
        error,
        isLoading: false,
      })
    }
  },

  // Set current quiz
  setCurrentQuiz: (quiz) => {
    set({ currentQuiz: quiz })
  },

  // Set view
  setView: (view) => {
    set({ currentView: view })
  },

  // Set builder quiz ID (also sets view to builder)
  setBuilderQuizId: (quizId) => {
    if (quizId) {
      set({ builderQuizId: quizId, currentView: "builder" })
      // If quiz is already loaded, set it as current
      const { quizzes } = get()
      const quiz = quizzes.find((q) => q.id === quizId)
      if (quiz) {
        set({ currentQuiz: quiz })
      }
    } else {
      set({ builderQuizId: null, currentView: "list" })
    }
  },

  // Update quiz draft
  updateQuizDraft: (updates) => {
    const { data, originalData } = get()
    if (!data) {
      throw new Error("Quiz data not loaded. Please refresh.")
    }

    const updated = updates(data)
    const changed = JSON.stringify(updated) !== JSON.stringify(originalData)

    set({
      data: updated,
      hasPendingChanges: changed,
      quizzes: updated.quizzes || [],
      currentQuiz: updated.quizzes.find((q) => q.id === get().currentQuiz?.id) || null,
    })
  },

  // Add form step (draft only)
  addFormStep: (quizId, step) => {
    get().updateQuizDraft((data) => {
      const quiz = data.quizzes.find((q) => q.id === quizId)
      if (!quiz) {
        throw new Error(`Quiz ${quizId} not found`)
      }

      const updatedQuiz = {
        ...quiz,
        formSteps: [...quiz.formSteps, step as any],
      }

      return {
        ...data,
        quizzes: data.quizzes.map((q) => (q.id === quizId ? updatedQuiz : q)),
      }
    })
  },

  // Update form step (draft only)
  updateFormStep: (quizId, stepId, updates) => {
    get().updateQuizDraft((data) => {
      const quiz = data.quizzes.find((q) => q.id === quizId)
      if (!quiz) {
        throw new Error(`Quiz ${quizId} not found`)
      }

      const updatedQuiz = {
        ...quiz,
        formSteps: quiz.formSteps.map((fs) =>
          fs.id === stepId ? { ...fs, ...updates } : fs
        ),
      }

      return {
        ...data,
        quizzes: data.quizzes.map((q) => (q.id === quizId ? updatedQuiz : q)),
      }
    })
  },

  // Delete form step (draft only)
  deleteFormStep: (quizId, stepId) => {
    get().updateQuizDraft((data) => {
      const quiz = data.quizzes.find((q) => q.id === quizId)
      if (!quiz) {
        throw new Error(`Quiz ${quizId} not found`)
      }

      const updatedQuiz = {
        ...quiz,
        formSteps: quiz.formSteps.filter((fs) => fs.id !== stepId),
      }

      return {
        ...data,
        quizzes: data.quizzes.map((q) => (q.id === quizId ? updatedQuiz : q)),
      }
    })
  },

  // Reorder form step (draft only)
  reorderFormStep: (quizId, stepId, newOrder, newProgressStepId, oldProgressStepId) => {
    get().updateQuizDraft((data) => {
      const quiz = data.quizzes.find((q) => q.id === quizId)
      if (!quiz) {
        throw new Error(`Quiz ${quizId} not found`)
      }

      const updatedQuiz = {
        ...quiz,
        formSteps: quiz.formSteps.map((fs) =>
          fs.id === stepId ? { ...fs, order: newOrder, progressStepId: newProgressStepId } : fs
        ),
      }

      return {
        ...data,
        quizzes: data.quizzes.map((q) => (q.id === quizId ? updatedQuiz : q)),
      }
    })
  },

  // Reorder progress step (draft only)
  reorderProgressStep: (quizId, progressStepId, newOrder) => {
    console.log("=== REORDER PROGRESS STEP ===")
    console.log("Quiz ID:", quizId)
    console.log("Progress Step ID:", progressStepId)
    console.log("New Order:", newOrder)
    
    get().updateQuizDraft((data) => {
      const quiz = data.quizzes.find((q) => q.id === quizId)
      if (!quiz) {
        throw new Error(`Quiz ${quizId} not found`)
      }

      console.log("Before reorder - Progress Steps:", quiz.progressSteps.map(ps => ({ id: ps.id, name: ps.name, order: ps.order })))

      // Get all progress steps sorted by order
      const sortedProgressSteps = [...quiz.progressSteps].sort(
        (a, b) => a.order - b.order
      )
      
      const draggedStep = sortedProgressSteps.find((ps) => ps.id === progressStepId)
      if (!draggedStep) {
        throw new Error(`Progress step ${progressStepId} not found`)
      }

      console.log("Dragged Step:", { id: draggedStep.id, name: draggedStep.name, currentOrder: draggedStep.order })

      // Remove dragged step from array
      const withoutDragged = sortedProgressSteps.filter((ps) => ps.id !== progressStepId)
      
      // Insert at new position
      const newIndex = Math.max(0, Math.min(newOrder - 1, withoutDragged.length))
      withoutDragged.splice(newIndex, 0, draggedStep)

      console.log("After reorder calculation - New positions:", withoutDragged.map((ps, idx) => ({ id: ps.id, name: ps.name, newOrder: idx + 1 })))

      // Recalculate orders based on new positions
      const reorderedProgressSteps = quiz.progressSteps.map((ps) => {
        const newIndex = withoutDragged.findIndex((p) => p.id === ps.id)
        const finalOrder = newIndex >= 0 ? newIndex + 1 : ps.order
        console.log(`Progress step ${ps.id}: ${ps.order} -> ${finalOrder}`)
        return {
          ...ps,
          order: finalOrder,
        }
      })

      console.log("After reorder - Progress Steps:", reorderedProgressSteps.map(ps => ({ id: ps.id, name: ps.name, order: ps.order })))

      const updatedQuiz = {
        ...quiz,
        progressSteps: reorderedProgressSteps,
      }

      return {
        ...data,
        quizzes: data.quizzes.map((q) => (q.id === quizId ? updatedQuiz : q)),
      }
    })
  },

  // Add progress step (draft only)
  addProgressStep: (quizId, step) => {
    get().updateQuizDraft((data) => {
      const quiz = data.quizzes.find((q) => q.id === quizId)
      if (!quiz) {
        throw new Error(`Quiz ${quizId} not found`)
      }

      // Calculate next order
      const maxOrder = quiz.progressSteps.length > 0
        ? Math.max(...quiz.progressSteps.map((ps) => ps.order))
        : 0

      const newProgressStep: ProgressStep = {
        id: `temp-progress-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        order: maxOrder + 1,
        ...step,
      }

      const updatedQuiz = {
        ...quiz,
        progressSteps: [...quiz.progressSteps, newProgressStep],
      }

      return {
        ...data,
        quizzes: data.quizzes.map((q) => (q.id === quizId ? updatedQuiz : q)),
      }
    })
  },

  // Save quiz changes
  saveQuizChanges: async (quizId, changes, owner?, repo?, branch?) => {
    const { data, sha } = get()

    if (!data || !sha) {
      throw new Error("Quiz data not loaded. Please refresh.")
    }

    const repoInfo = owner && repo
      ? { owner, repo, branch: branch || "main" }
      : getRepoInfo()

    if (!repoInfo) {
      throw new Error("Repository not configured.")
    }

    try {
      set({ isSaving: true, error: null, hasConflict: false })

      const response = await saveQuizChanges(
        repoInfo.owner,
        repoInfo.repo,
        repoInfo.branch,
        quizId,
        changes,
        sha
      )

      // If a new quiz was created (editing a default quiz), add it to the list
      // Otherwise, update the existing quiz
      let updatedData
      if (response.isNewQuiz) {
        // Add new quiz to the list (don't remove the original default quiz)
        updatedData = {
          ...data,
          quizzes: [...data.quizzes, response.quiz],
        }
        // Update builder quiz ID to the new quiz
        set({ builderQuizId: response.quiz.id })
      } else {
        // Update existing quiz
        updatedData = {
          ...data,
          quizzes: data.quizzes.map((q) => (q.id === quizId ? response.quiz : q)),
        }
      }

      set({
        data: updatedData,
        originalData: updatedData,
        currentQuiz: response.quiz,
        sha: response.newSha,
        isSaving: false,
        hasPendingChanges: false,
        feedback: {
          type: "success",
          message: response.isNewQuiz
            ? `Custom quiz "${response.quiz.name}" created successfully. The original default quiz was not modified.`
            : "Quiz changes saved successfully.",
        },
      })
    } catch (err) {
      const error = err as QuizServiceError
      const isConflict = error.type === "conflict_error"

      set({
        isSaving: false,
        hasConflict: isConflict,
        error,
        feedback: {
          type: "error",
          message: error.message || "Failed to save quiz changes.",
        },
      })

      if (!isConflict) {
        throw err
      }
    }
  },

  // Create new quiz
  createNewQuiz: async (quizData, owner?, repo?, branch?) => {
    const repoInfo = owner && repo
      ? { owner, repo, branch: branch || "main" }
      : getRepoInfo()

    if (!repoInfo) {
      throw new Error("Repository not configured.")
    }

    try {
      set({ isSaving: true, error: null })

      const response = await createQuizService(
        repoInfo.owner,
        repoInfo.repo,
        repoInfo.branch,
        quizData
      )

      // Add new quiz to data
      const { data } = get()
      const updatedData = data
        ? {
            ...data,
            quizzes: [...data.quizzes, response.quiz],
          }
        : {
            quizzes: [response.quiz],
            templates: [],
          }

      set({
        data: updatedData,
        originalData: updatedData,
        quizzes: updatedData.quizzes,
        currentQuiz: response.quiz,
        sha: response.sha,
        isSaving: false,
        feedback: {
          type: "success",
          message: "Quiz created successfully.",
        },
      })
    } catch (err) {
      const error = err as QuizServiceError
      set({
        isSaving: false,
        error,
        feedback: {
          type: "error",
          message: error.message || "Failed to create quiz.",
        },
      })
      throw err
    }
  },

  // Reset draft to original
  resetDraft: () => {
    const { originalData } = get()
    if (!originalData) {
      return
    }

    set({
      data: JSON.parse(JSON.stringify(originalData)),
      hasPendingChanges: false,
      hasConflict: false,
      feedback: {
        type: "success",
        message: "All changes discarded.",
      },
    })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },

  // Clear feedback
  clearFeedback: () => {
    set({ feedback: { type: null, message: null } })
  },

  // Refresh and retry after conflict
  refreshAndRetry: async (quizId, changes, owner?, repo?, branch?) => {
    const { data } = get()

    // Store current draft changes
    const draftData = data ? JSON.parse(JSON.stringify(data)) : null

    // Fetch fresh data
    await get().fetchQuizData(owner, repo, branch)

    // Re-apply draft changes if needed
    if (draftData) {
      get().updateQuizDraft(() => draftData)
    }

    // Clear conflict flag and retry save
    set({ hasConflict: false })
    await get().saveQuizChanges(quizId, changes, owner, repo, branch)
  },
}))

