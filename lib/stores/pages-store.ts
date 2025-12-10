/**
 * Pages and Sections store for managing pages.json and sections.json data
 */

import { create } from "zustand"
import type { PagesData, PageKey } from "@/lib/types/pages"
import type { SectionsData } from "@/lib/types/sections"
import { fetchPagesData, savePagesData } from "@/lib/services/pages"
import { fetchSectionsData, saveSectionsData } from "@/lib/services/sections"
import { useOrganizationStore } from "./organization-store"

export type ViewState = "pages" | "sections" | "components" | "brand-settings"

interface PagesStore {
  // Original data (from server)
  originalPagesData: PagesData | null
  originalSectionsData: SectionsData | null
  pagesSha: string | null
  sectionsSha: string | null

  // Draft data (user edits)
  pagesData: PagesData | null
  sectionsData: SectionsData | null

  // View state
  currentView: ViewState
  selectedPageKey: PageKey | null
  selectedSectionName: string | null

  // Loading & error states
  isLoading: boolean
  isSaving: boolean
  error: string | null
  feedback: { type: "success" | "error"; message: string } | null
  hasConflict: boolean // True when a 409 conflict occurred

  // Computed
  hasPendingChanges: boolean

  // Actions
  fetchData: () => Promise<void>
  setView: (view: ViewState) => void
  selectPage: (pageKey: PageKey) => void
  selectSection: (sectionName: string) => void
  goBack: () => void
  
  // Pages actions (draft updates - no save)
  updatePagesData: (updates: (data: PagesData) => PagesData) => void
  
  // Sections actions (draft updates - no save)
  updateSectionsData: (updates: (data: SectionsData) => SectionsData) => void
  
  // Save all pending changes
  saveAll: () => Promise<void>
  
  // Discard all pending changes
  discardChanges: () => void
  
  // Refresh and retry after conflict
  refreshAndRetry: () => Promise<void>
  
  // Utility
  clearError: () => void
  clearFeedback: () => void
}

export const usePagesStore = create<PagesStore>((set, get) => ({
  // Initial state
  originalPagesData: null,
  originalSectionsData: null,
  pagesData: null,
  sectionsData: null,
  pagesSha: null,
  sectionsSha: null,
  currentView: "pages",
  selectedPageKey: null,
  selectedSectionName: null,
  isLoading: false,
  isSaving: false,
  error: null,
  feedback: null,
  hasConflict: false,
  hasPendingChanges: false,

  // Fetch both files
  fetchData: async () => {
    const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore.getState()
    const owner = repoOwnerFromLink || ""
    const repo = repoNameFromLink || ""

    if (!owner || !repo) {
      set({
        error: "Repository owner/name missing. Configure via organization settings.",
        isLoading: false,
      })
      return
    }

      set({ isLoading: true, error: null, feedback: null, hasConflict: false })

    try {
      const [pagesResponse, sectionsResponse] = await Promise.all([
        fetchPagesData(owner, repo),
        fetchSectionsData(owner, repo),
      ])

      set({
        originalPagesData: pagesResponse.pages,
        originalSectionsData: sectionsResponse.sections,
        pagesData: pagesResponse.pages,
        sectionsData: sectionsResponse.sections,
        pagesSha: pagesResponse.sha,
        sectionsSha: sectionsResponse.sha,
        isLoading: false,
        hasPendingChanges: false,
      })
    } catch (err) {
      set({
        error: (err as Error).message || "Failed to load pages and sections data.",
        isLoading: false,
      })
    }
  },

  // View navigation
  setView: (view: ViewState) => {
    set({ currentView: view })
  },

  selectPage: (pageKey: PageKey) => {
    set({
      selectedPageKey: pageKey,
      currentView: "sections",
      selectedSectionName: null,
    })
  },

  selectSection: (sectionName: string) => {
    set({
      selectedSectionName: sectionName,
      currentView: "components",
    })
  },

  goBack: () => {
    const { currentView, selectedPageKey } = get()
    if (currentView === "components") {
      set({ currentView: "sections", selectedSectionName: null })
    } else if (currentView === "sections") {
      set({ currentView: "pages", selectedPageKey: null })
    }
  },

  // Update pages data (draft only - no save)
  updatePagesData: (updates: (data: PagesData) => PagesData) => {
    const { pagesData, originalPagesData, sectionsData, originalSectionsData } = get()
    if (!pagesData) {
      throw new Error("Pages data not loaded. Please refresh.")
    }

    const updated = updates(pagesData)
    const pagesChanged = JSON.stringify(updated) !== JSON.stringify(originalPagesData)
    const sectionsChanged = originalSectionsData 
      ? JSON.stringify(sectionsData) !== JSON.stringify(originalSectionsData)
      : false
    
    set({ 
      pagesData: updated,
      hasPendingChanges: pagesChanged || sectionsChanged,
    })
  },

  // Update sections data (draft only - no save)
  updateSectionsData: (updates: (data: SectionsData) => SectionsData) => {
    const { sectionsData, originalSectionsData, pagesData, originalPagesData } = get()
    if (!sectionsData) {
      throw new Error("Sections data not loaded. Please refresh.")
    }

    const updated = updates(sectionsData)
    const sectionsChanged = JSON.stringify(updated) !== JSON.stringify(originalSectionsData)
    const pagesChanged = originalPagesData
      ? JSON.stringify(pagesData) !== JSON.stringify(originalPagesData)
      : false
    
    set({ 
      sectionsData: updated,
      hasPendingChanges: pagesChanged || sectionsChanged,
    })
  },

  // Save all pending changes
  saveAll: async () => {
    const { pagesData, sectionsData, pagesSha, sectionsSha, originalPagesData, originalSectionsData } = get()
    
    if (!pagesData || !sectionsData || !pagesSha || !sectionsSha) {
      throw new Error("Data not loaded. Please refresh.")
    }

    const pagesChanged = JSON.stringify(pagesData) !== JSON.stringify(originalPagesData)
    const sectionsChanged = JSON.stringify(sectionsData) !== JSON.stringify(originalSectionsData)

    if (!pagesChanged && !sectionsChanged) {
      set({
        feedback: {
          type: "success",
          message: "No changes to save.",
        },
      })
      return
    }

    try {
      const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore.getState()
      const owner = repoOwnerFromLink || ""
      const repo = repoNameFromLink || ""

      if (!owner || !repo) {
        throw new Error("Repository owner/name missing.")
      }

      set({ isSaving: true, error: null, hasConflict: false })

      // Save both files in parallel if they have changes
      const savePromises: Promise<any>[] = []
      
      if (pagesChanged) {
        savePromises.push(savePagesData(owner, repo, pagesData, pagesSha))
      }
      
      if (sectionsChanged) {
        savePromises.push(saveSectionsData(owner, repo, sectionsData, sectionsSha))
      }

      const results = await Promise.all(savePromises)
      
      // Update state with saved data
      const newState: Partial<PagesStore> = {
        isSaving: false,
        hasPendingChanges: false,
        feedback: {
          type: "success",
          message: "All changes saved successfully.",
        },
      }

      if (pagesChanged && results[0]) {
        newState.pagesData = results[0].pages
        newState.originalPagesData = results[0].pages
        newState.pagesSha = results[0].newSha
      }

      if (sectionsChanged) {
        const sectionsResult = pagesChanged ? results[1] : results[0]
        if (sectionsResult) {
          newState.sectionsData = sectionsResult.sections
          newState.originalSectionsData = sectionsResult.sections
          newState.sectionsSha = sectionsResult.newSha
        }
      }

      set(newState)
    } catch (err) {
      const error = err as Error & { isConflict?: boolean }
      const isConflict = error.isConflict === true
      
      set({
        isSaving: false,
        hasConflict: isConflict,
        error: error.message || "Failed to save changes.",
        feedback: {
          type: "error",
          message: error.message || "Failed to save changes.",
        },
      })
      
      // Don't throw if it's a conflict - let UI handle it
      if (!isConflict) {
        throw err
      }
    }
  },

  // Discard all pending changes
  discardChanges: () => {
    const { originalPagesData, originalSectionsData } = get()
    if (!originalPagesData || !originalSectionsData) {
      return
    }

    set({
      pagesData: JSON.parse(JSON.stringify(originalPagesData)),
      sectionsData: JSON.parse(JSON.stringify(originalSectionsData)),
      hasPendingChanges: false,
      hasConflict: false,
      feedback: {
        type: "success",
        message: "All changes discarded.",
      },
    })
  },

  // Refresh and retry after conflict
  refreshAndRetry: async () => {
    const { pagesData, sectionsData } = get()
    
    // Store current draft changes
    const draftPages = pagesData ? JSON.parse(JSON.stringify(pagesData)) : null
    const draftSections = sectionsData ? JSON.parse(JSON.stringify(sectionsData)) : null
    
    // Fetch fresh data
    await get().fetchData()
    
    // Re-apply draft changes on top of fresh data
    if (draftPages) {
      get().updatePagesData(() => draftPages)
    }
    if (draftSections) {
      get().updateSectionsData(() => draftSections)
    }
    
    // Clear conflict flag and retry save
    set({ hasConflict: false })
    await get().saveAll()
  },

  clearError: () => {
    set({ error: null })
  },

  clearFeedback: () => {
    set({ feedback: null })
  },
}))

