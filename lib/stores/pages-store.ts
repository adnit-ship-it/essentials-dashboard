/**
 * Pages and Sections store for managing pages.json, sections.json, common.json, media.json
 */

import { create } from "zustand"
import type { PagesData, PageKey, AnnouncementConfig } from "@/lib/types/pages"
import type { SectionsData } from "@/lib/types/sections"
import type { CommonData } from "@/lib/types/common"
import type { MediaData } from "@/lib/types/media"
import type { SectionsRegistry } from "@/lib/types/sections-registry"
import { fetchPagesData, savePagesData } from "@/lib/services/pages"
import { fetchSectionsData, saveSectionsData } from "@/lib/services/sections"
import { fetchCommonData, saveCommonData } from "@/lib/services/common"
import { fetchMediaData, saveMediaData } from "@/lib/services/media"
import {
  enqueueCommit,
  processQueue,
  clearQueue,
  type CommitJob,
} from "@/lib/services/commit-queue"
import {
  pagesUpdateMessage,
  sectionsUpdateMessage,
  commonUpdateMessage,
  mediaUpdateMessage,
  deletePageMessage,
  deleteSectionMessage,
} from "@/lib/utils/commit-messages"
import { removePage, removeSection } from "@/lib/utils/pages-helpers"
import { findSectionByName } from "@/lib/types/sections"
import { useOrganizationStore } from "./organization-store"

const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")

export type ViewState = "pages" | "sections" | "components" | "brand-settings"

/** Clear invalid navigation state after fetch (prevents "Section not found" after refresh). */
function getNavigationStateAfterFetch(
  selectedPageKey: PageKey | null,
  selectedSectionName: string | null,
  pagesData: PagesData,
  sectionsData: SectionsData
): Partial<Pick<PagesStore, "selectedPageKey" | "selectedSectionName" | "currentView">> {
  const updates: Partial<Pick<PagesStore, "selectedPageKey" | "selectedSectionName" | "currentView">> = {}
  if (selectedPageKey && !(selectedPageKey in pagesData)) {
    updates.selectedPageKey = null
    updates.selectedSectionName = null
    updates.currentView = "pages"
  } else if (selectedSectionName && !findSectionByName(sectionsData, selectedSectionName)) {
    updates.selectedSectionName = null
    updates.currentView = "sections"
  }
  return updates
}

/** Executor for commit queue: runs one job with 409 retry (re-fetch SHA, retry once). */
function createCommitExecutor(
  owner: string,
  repo: string,
  get: () => PagesStore,
  set: (partial: Partial<PagesStore>) => void
) {
  return async (job: CommitJob): Promise<{ newSha: string; [key: string]: unknown }> => {
    const runWithRetry = async (retry = false): Promise<{ newSha: string; [key: string]: unknown }> => {
      const state = get()
      switch (job.type) {
        case "pages": {
          let sha = state.pagesSha || ""
          if (retry) {
            const fresh = await fetchPagesData(owner, repo)
            sha = fresh.sha
            set({ pagesSha: sha })
          }
          const result = await savePagesData(owner, repo, job.data as PagesData, sha, job.message)
          set({ pagesData: result.pages, originalPagesData: result.pages, pagesSha: result.newSha })
          return result
        }
        case "sections": {
          let sha = state.sectionsSha || ""
          if (retry) {
            const fresh = await fetchSectionsData(owner, repo)
            sha = fresh.sha
            set({ sectionsSha: sha })
          }
          const result = await saveSectionsData(owner, repo, job.data as SectionsData, sha, job.message)
          set({ sectionsData: result.sections, originalSectionsData: result.sections, sectionsSha: result.newSha })
          return result
        }
        case "common": {
          let sha = state.commonSha || ""
          if (retry) {
            const fresh = await fetchCommonData(owner, repo)
            sha = fresh.sha
            set({ commonSha: sha })
          }
          const result = await saveCommonData(owner, repo, job.data as CommonData, sha || undefined, job.message)
          set({ commonData: result.common, originalCommonData: result.common, commonSha: result.newSha })
          return result
        }
        case "media": {
          let sha = state.mediaSha || ""
          if (retry) {
            const fresh = await fetchMediaData(owner, repo)
            sha = fresh.sha
            set({ mediaSha: sha })
          }
          const result = await saveMediaData(owner, repo, job.data as MediaData, sha || undefined, job.message)
          set({ mediaData: result.media, originalMediaData: result.media, mediaSha: result.newSha })
          return result
        }
        default:
          throw new Error(`Unknown commit job type: ${(job as CommitJob).type}`)
      }
    }
    try {
      return await runWithRetry()
    } catch (err) {
      const error = err as Error & { isConflict?: boolean }
      if (error.isConflict === true) {
        return await runWithRetry(true)
      }
      throw err
    }
  }
}

interface PagesStore {
  // Original data (from server)
  originalPagesData: PagesData | null
  originalSectionsData: SectionsData | null
  originalCommonData: CommonData | null
  originalMediaData: MediaData | null
  pagesSha: string | null
  sectionsSha: string | null
  commonSha: string | null
  mediaSha: string | null
  sectionsRegistryData: SectionsRegistry | null
  hostTemplateInfo: { templateName: string; hostedAt: string } | null

  // Draft data (user edits)
  pagesData: PagesData | null
  sectionsData: SectionsData | null
  commonData: CommonData | null
  mediaData: MediaData | null

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
  
  // Common data action (draft update - no save)
  updateCommonData: (updates: (data: CommonData) => CommonData) => void

  // Page metadata (title, description) - updates common.strings
  updatePageMetadata: (title: string, description: string) => void
  
  // Media data action (draft update - no save)
  updateMediaData: (updates: (data: MediaData) => MediaData) => void
  
  // Announcement action (draft update - no save)
  updateAnnouncement: (announcement: AnnouncementConfig) => void
  
  // Sections actions (draft updates - no save)
  updateSectionsData: (updates: (data: SectionsData) => SectionsData) => void
  
  // Update both pages and sections (e.g. when adding a section)
  updatePagesAndSections: (updates: (p: PagesData, s: SectionsData) => { pagesData: PagesData; sectionsData: SectionsData }) => void
  
  // Save all pending changes
  saveAll: () => Promise<void>

  // Commit pages only (for add-page flow)
  commitPages: (pages: PagesData, message: string) => Promise<void>

  // Commit pages and sections (for add-section flow)
  commitPagesAndSections: (
    pages: PagesData,
    sections: SectionsData,
    messages: { pages?: string; sections?: string }
  ) => Promise<void>

  // Delete page (commit-on-delete)
  deletePage: (pageKey: PageKey) => Promise<void>

  // Delete section (commit-on-delete, updates both pages and sections)
  deleteSection: (pageKey: PageKey, sectionName: string) => Promise<void>
  
  // Discard all pending changes
  discardChanges: () => void
  
  // Refresh and retry after conflict
  refreshAndRetry: () => Promise<void>
  
  // Utility
  clearError: () => void
  clearFeedback: () => void
  setHostTemplateInfo: (info: { templateName: string; hostedAt: string } | null) => void
}

export const usePagesStore = create<PagesStore>((set, get) => ({
  // Initial state
  originalPagesData: null,
  originalSectionsData: null,
  originalCommonData: null,
  originalMediaData: null,
  pagesData: null,
  sectionsData: null,
  commonData: null,
  mediaData: null,
  pagesSha: null,
  sectionsSha: null,
  commonSha: null,
  mediaSha: null,
  sectionsRegistryData: null,
  hostTemplateInfo: null,
  currentView: "pages",
  selectedPageKey: null,
  selectedSectionName: null,
  isLoading: false,
  isSaving: false,
  error: null,
  feedback: null,
  hasConflict: false,
  hasPendingChanges: false,

  // Fetch all template data (batch)
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
      const batchUrl = `${API_BASE_URL}/api/template-data?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      const batchResponse = await fetch(batchUrl)

      if (!batchResponse.ok) {
        throw new Error("Failed to fetch template data. Falling back to individual fetches.")
      }

      const batch = await batchResponse.json()
      const pages = batch.pages || {}
      const sections = Array.isArray(batch.sections) ? batch.sections : []
      const common = batch.common || {}
      const media = batch.media || {}
      const sectionsRegistry = batch.sectionsRegistry || { sections: [] }
      const hostTemplateInfo = batch.hostTemplate ?? null

      const navState = getNavigationStateAfterFetch(
        get().selectedPageKey,
        get().selectedSectionName,
        pages,
        sections
      )

      set({
        originalPagesData: pages,
        originalSectionsData: sections,
        originalCommonData: common,
        originalMediaData: media,
        pagesData: pages,
        sectionsData: sections,
        commonData: common,
        mediaData: media,
        pagesSha: batch.pagesSha || "",
        sectionsSha: batch.sectionsSha || "",
        commonSha: batch.commonSha || "",
        mediaSha: batch.mediaSha || "",
        sectionsRegistryData: sectionsRegistry,
        hostTemplateInfo,
        isLoading: false,
        hasPendingChanges: false,
        ...navState,
      })
    } catch (err) {
      try {
        const [pagesResponse, sectionsResponse] = await Promise.all([
          fetchPagesData(owner, repo),
          fetchSectionsData(owner, repo),
        ])
        let commonData: CommonData = {}
        let mediaData: MediaData = {}
        let commonSha = ""
        let mediaSha = ""
        try {
          const [c, m] = await Promise.all([
            fetchCommonData(owner, repo),
            fetchMediaData(owner, repo),
          ])
          commonData = c.common
          mediaData = m.media
          commonSha = c.sha
          mediaSha = m.sha
        } catch {
          // Ignore - common/media may not exist
        }
        let sectionsRegistryData: SectionsRegistry | null = null
        let hostTemplateInfo: { templateName: string; hostedAt: string } | null = null
        try {
          const regRes = await fetch(`${API_BASE_URL}/api/sections-registry?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`)
          if (regRes.ok) {
            const reg = await regRes.json()
            sectionsRegistryData = reg.sectionsRegistry || { sections: [] }
          }
        } catch {
          // Ignore
        }
        try {
          const htRes = await fetch(`${API_BASE_URL}/api/host-template?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`)
          if (htRes.ok) {
            const ht = await htRes.json()
            hostTemplateInfo = { templateName: ht.templateName || "", hostedAt: ht.hostedAt || "" }
          }
        } catch {
          // Ignore
        }

        const navState = getNavigationStateAfterFetch(
          get().selectedPageKey,
          get().selectedSectionName,
          pagesResponse.pages,
          sectionsResponse.sections
        )

        set({
          originalPagesData: pagesResponse.pages,
          originalSectionsData: sectionsResponse.sections,
          originalCommonData: commonData,
          originalMediaData: mediaData,
          pagesData: pagesResponse.pages,
          sectionsData: sectionsResponse.sections,
          commonData,
          mediaData,
          pagesSha: pagesResponse.sha,
          sectionsSha: sectionsResponse.sha,
          commonSha: commonSha || null,
          mediaSha: mediaSha || null,
          sectionsRegistryData,
          hostTemplateInfo,
          isLoading: false,
          hasPendingChanges: false,
          ...navState,
        })
      } catch (fallbackErr) {
        const errorMessage = (fallbackErr as Error).message || "Failed to load pages and sections data."
        let enhancedMessage = errorMessage
        if (errorMessage.toLowerCase().includes('repository') && errorMessage.toLowerCase().includes('not found')) {
          enhancedMessage = `Repository "${owner}/${repo}" not found or has been deleted. Please link a valid repository.`
        }
        set({
          error: enhancedMessage,
          isLoading: false,
        })
      }
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

  updateCommonData: (updates: (data: CommonData) => CommonData) => {
    const { commonData, originalCommonData, pagesData, sectionsData, originalPagesData, originalSectionsData } = get()
    const current = commonData ?? {}
    const updated = updates(current)
    const commonChanged = JSON.stringify(updated) !== JSON.stringify(originalCommonData ?? {})
    const pagesChanged = originalPagesData ? JSON.stringify(pagesData) !== JSON.stringify(originalPagesData) : false
    const sectionsChanged = originalSectionsData ? JSON.stringify(sectionsData) !== JSON.stringify(originalSectionsData) : false
    set({ commonData: updated, hasPendingChanges: commonChanged || pagesChanged || sectionsChanged })
  },

  updateMediaData: (updates: (data: MediaData) => MediaData) => {
    const { mediaData, originalMediaData, pagesData, sectionsData, originalPagesData, originalSectionsData } = get()
    const current = mediaData ?? {}
    const updated = updates(current)
    const mediaChanged = JSON.stringify(updated) !== JSON.stringify(originalMediaData ?? {})
    const pagesChanged = originalPagesData ? JSON.stringify(pagesData) !== JSON.stringify(originalPagesData) : false
    const sectionsChanged = originalSectionsData ? JSON.stringify(sectionsData) !== JSON.stringify(originalSectionsData) : false
    set({ mediaData: updated, hasPendingChanges: mediaChanged || pagesChanged || sectionsChanged })
  },

  updateAnnouncement: (announcement: AnnouncementConfig) => {
    get().updateCommonData((common) => ({ ...common, announcement }))
  },

  updatePageMetadata: (title: string, description: string) => {
    get().updateCommonData((common) => {
      const strings = common.strings ?? {}
      return {
        ...common,
        strings: {
          ...strings,
          pageTitle: title,
          pageDescription: description,
        },
      }
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

  updatePagesAndSections: (updates: (p: PagesData, s: SectionsData) => { pagesData: PagesData; sectionsData: SectionsData }) => {
    const { pagesData, sectionsData, originalPagesData, originalSectionsData } = get()
    if (!pagesData || !sectionsData) {
      throw new Error("Pages and sections data not loaded. Please refresh.")
    }
    const { pagesData: newPages, sectionsData: newSections } = updates(pagesData, sectionsData)
    const pagesChanged = JSON.stringify(newPages) !== JSON.stringify(originalPagesData)
    const sectionsChanged = JSON.stringify(newSections) !== JSON.stringify(originalSectionsData)
    set({ pagesData: newPages, sectionsData: newSections, hasPendingChanges: pagesChanged || sectionsChanged })
  },

  // Save all pending changes (uses commit queue for sequential commits)
  saveAll: async () => {
    const { pagesData, sectionsData, commonData, mediaData, pagesSha, sectionsSha, commonSha, mediaSha, originalPagesData, originalSectionsData, originalCommonData, originalMediaData } = get()
    
    if (!pagesData || !sectionsData) {
      throw new Error("Data not loaded. Please refresh.")
    }

    const pagesChanged = JSON.stringify(pagesData) !== JSON.stringify(originalPagesData)
    const sectionsChanged = JSON.stringify(sectionsData) !== JSON.stringify(originalSectionsData)
    const commonChanged = commonData && JSON.stringify(commonData) !== JSON.stringify(originalCommonData ?? {})
    const mediaChanged = mediaData && JSON.stringify(mediaData) !== JSON.stringify(originalMediaData ?? {})

    if (!pagesChanged && !sectionsChanged && !commonChanged && !mediaChanged) {
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

      clearQueue()
      if (pagesChanged) {
        enqueueCommit({ type: "pages", data: pagesData, message: pagesUpdateMessage() })
      }
      if (sectionsChanged) {
        enqueueCommit({ type: "sections", data: sectionsData, message: sectionsUpdateMessage() })
      }
      if (commonChanged && commonData) {
        enqueueCommit({ type: "common", data: commonData, message: commonUpdateMessage() })
      }
      if (mediaChanged && mediaData) {
        enqueueCommit({ type: "media", data: mediaData, message: mediaUpdateMessage() })
      }

      await processQueue(createCommitExecutor(owner, repo, get, set))

      set({
        isSaving: false,
        hasPendingChanges: false,
        feedback: {
          type: "success",
          message: "All changes saved successfully.",
        },
      })
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
      
      if (!isConflict) {
        throw err
      }
    }
  },

  commitPages: async (pages: PagesData, message: string) => {
    const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore.getState()
    const owner = repoOwnerFromLink || ""
    const repo = repoNameFromLink || ""
    if (!owner || !repo) throw new Error("Repository owner/name missing.")
    if (!pages) throw new Error("Pages data not loaded. Please refresh.")

    set({ isSaving: true, error: null, hasConflict: false })
    clearQueue()
    enqueueCommit({ type: "pages", data: pages, message })

    try {
      await processQueue(createCommitExecutor(owner, repo, get, set))
      set({
        isSaving: false,
        hasPendingChanges: false,
        feedback: { type: "success", message: "Page saved successfully." },
      })
    } catch (err) {
      const error = err as Error & { isConflict?: boolean }
      set({
        isSaving: false,
        hasConflict: error.isConflict === true,
        error: error.message || "Failed to save page.",
        feedback: { type: "error", message: error.message || "Failed to save page." },
      })
      throw err
    }
  },

  commitPagesAndSections: async (
    pages: PagesData,
    sections: SectionsData,
    messages: { pages?: string; sections?: string }
  ) => {
    const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore.getState()
    const owner = repoOwnerFromLink || ""
    const repo = repoNameFromLink || ""
    if (!owner || !repo) throw new Error("Repository owner/name missing.")
    if (!pages || !sections) throw new Error("Pages and sections data not loaded. Please refresh.")

    set({ isSaving: true, error: null, hasConflict: false })
    clearQueue()
    enqueueCommit({ type: "pages", data: pages, message: messages.pages || "New section" })
    enqueueCommit({ type: "sections", data: sections, message: messages.sections || "New section" })

    try {
      await processQueue(createCommitExecutor(owner, repo, get, set))
      set({
        isSaving: false,
        hasPendingChanges: false,
        feedback: { type: "success", message: "Section saved successfully." },
      })
    } catch (err) {
      const error = err as Error & { isConflict?: boolean }
      set({
        isSaving: false,
        hasConflict: error.isConflict === true,
        error: error.message || "Failed to save section.",
        feedback: { type: "error", message: error.message || "Failed to save section." },
      })
      throw err
    }
  },

  deletePage: async (pageKey: PageKey) => {
    const { pagesData } = get()
    if (!pagesData) throw new Error("Pages data not loaded. Please refresh.")
    const page = pagesData[pageKey] as { title?: string } | undefined
    const title = page?.title ?? pageKey
    const updated = removePage(pagesData, pageKey)
    await get().commitPages(updated, deletePageMessage(title))
    set({ selectedPageKey: get().selectedPageKey === pageKey ? null : get().selectedPageKey })
  },

  deleteSection: async (pageKey: PageKey, sectionName: string) => {
    const { pagesData, sectionsData } = get()
    if (!pagesData || !sectionsData) throw new Error("Data not loaded. Please refresh.")
    const { pagesData: newPages, sectionsData: newSections } = removeSection(
      pagesData,
      sectionsData,
      pageKey,
      sectionName
    )
    const msg = deleteSectionMessage(sectionName)
    await get().commitPagesAndSections(newPages, newSections, {
      pages: msg,
      sections: msg,
    })
    if (get().selectedSectionName === sectionName) {
      set({ selectedSectionName: null, currentView: "sections" })
    }
  },

  discardChanges: () => {
    const { originalPagesData, originalSectionsData, originalCommonData, originalMediaData } = get()
    if (!originalPagesData || !originalSectionsData) {
      return
    }

    set({
      pagesData: JSON.parse(JSON.stringify(originalPagesData)),
      sectionsData: JSON.parse(JSON.stringify(originalSectionsData)),
      commonData: originalCommonData ? JSON.parse(JSON.stringify(originalCommonData)) : null,
      mediaData: originalMediaData ? JSON.parse(JSON.stringify(originalMediaData)) : null,
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
    const { pagesData, sectionsData, commonData, mediaData } = get()
    
    const draftPages = pagesData ? JSON.parse(JSON.stringify(pagesData)) : null
    const draftSections = sectionsData ? JSON.parse(JSON.stringify(sectionsData)) : null
    const draftCommon = commonData ? JSON.parse(JSON.stringify(commonData)) : null
    const draftMedia = mediaData ? JSON.parse(JSON.stringify(mediaData)) : null
    
    await get().fetchData()
    
    if (draftPages) get().updatePagesData(() => draftPages)
    if (draftSections) get().updateSectionsData(() => draftSections)
    if (draftCommon) get().updateCommonData(() => draftCommon)
    if (draftMedia) get().updateMediaData(() => draftMedia)

    set({ hasConflict: false })
    await get().saveAll()
  },

  clearError: () => {
    set({ error: null })
  },

  clearFeedback: () => {
    set({ feedback: null })
  },

  setHostTemplateInfo: (info) => {
    set({ hostTemplateInfo: info })
  },
}))

