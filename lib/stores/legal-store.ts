/**
 * Legal pages store for managing data/legal.json
 */

import { create } from "zustand";
import type { LegalData, LegalPage } from "@/lib/types/legal";
import { createLegalPage } from "@/lib/types/legal";
import { fetchLegalData, saveLegalData } from "@/lib/services/legal";
import { useOrganizationStore } from "./organization-store";

interface LegalStore {
  // Original data (from server)
  originalLegalData: LegalData | null;
  legalSha: string | null;

  // Draft data (user edits)
  legalData: LegalData | null;

  // UI state
  selectedPageId: string | null;
  editingPageId: string | null;

  // Loading & error states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  feedback: { type: "success" | "error"; message: string } | null;
  hasConflict: boolean;

  // Computed
  hasPendingChanges: boolean;

  // Actions
  fetchData: () => Promise<void>;
  selectPage: (pageId: string | null) => void;
  setEditingPage: (pageId: string | null) => void;

  // CRUD actions (draft updates - no save)
  addPage: (title: string) => void;
  updatePage: (pageId: string, updates: Partial<LegalPage>) => void;
  deletePage: (pageId: string) => void;
  reorderPages: (pageIds: string[]) => void;

  // Save all pending changes
  saveAll: () => Promise<void>;

  // Discard all pending changes
  discardChanges: () => void;

  // Refresh and retry after conflict
  refreshAndRetry: () => Promise<void>;

  // Utility
  clearError: () => void;
  clearFeedback: () => void;
}

export const useLegalStore = create<LegalStore>((set, get) => ({
  // Initial state
  originalLegalData: null,
  legalData: null,
  legalSha: null,
  selectedPageId: null,
  editingPageId: null,
  isLoading: false,
  isSaving: false,
  error: null,
  feedback: null,
  hasConflict: false,
  hasPendingChanges: false,

  // Fetch legal data
  fetchData: async () => {
    const { repoOwnerFromLink, repoNameFromLink } =
      useOrganizationStore.getState();
    const owner = repoOwnerFromLink || "";
    const repo = repoNameFromLink || "";

    if (!owner || !repo) {
      set({
        error:
          "Repository owner/name missing. Configure via organization settings.",
        isLoading: false,
      });
      return;
    }

    set({ isLoading: true, error: null, feedback: null, hasConflict: false });

    try {
      const response = await fetchLegalData(owner, repo);

      set({
        originalLegalData: response.legal,
        legalData: response.legal,
        legalSha: response.sha,
        isLoading: false,
        hasPendingChanges: false,
      });
    } catch (err: any) {
      // Handle 404 - file doesn't exist yet
      if (err?.statusCode === 404 || err?.type === "file_not_found") {
        const emptyData: LegalData = { pages: [] };
        set({
          originalLegalData: emptyData,
          legalData: emptyData,
          legalSha: null, // No SHA means we'll create the file
          isLoading: false,
          hasPendingChanges: false,
        });
        return;
      }

      const errorMessage =
        (err as Error).message || "Failed to load legal pages data.";
      let enhancedMessage = errorMessage;
      if (
        errorMessage.toLowerCase().includes("repository") &&
        errorMessage.toLowerCase().includes("not found")
      ) {
        enhancedMessage = `Repository "${owner}/${repo}" not found or has been deleted. Please link a valid repository.`;
      }
      set({
        error: enhancedMessage,
        isLoading: false,
      });
    }
  },

  // Select page for viewing/editing
  selectPage: (pageId: string | null) => {
    set({ selectedPageId: pageId });
  },

  // Set page being edited
  setEditingPage: (pageId: string | null) => {
    set({ editingPageId: pageId });
  },

  // Add new page
  addPage: (title: string) => {
    const { legalData, originalLegalData } = get();
    if (!legalData) return;

    const newPage = createLegalPage(title, legalData.pages);
    const updatedData: LegalData = {
      ...legalData,
      pages: [...legalData.pages, newPage],
    };

    const hasChanges =
      JSON.stringify(updatedData) !== JSON.stringify(originalLegalData);

    set({
      legalData: updatedData,
      hasPendingChanges: hasChanges,
      editingPageId: newPage.id,
    });
  },

  // Update page
  updatePage: (pageId: string, updates: Partial<LegalPage>) => {
    const { legalData, originalLegalData } = get();
    if (!legalData) return;

    const updatedPages = legalData.pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            ...updates,
            lastUpdated: new Date().toISOString().split("T")[0],
          }
        : page
    );

    const updatedData: LegalData = {
      ...legalData,
      pages: updatedPages,
    };

    const hasChanges =
      JSON.stringify(updatedData) !== JSON.stringify(originalLegalData);

    set({
      legalData: updatedData,
      hasPendingChanges: hasChanges,
    });
  },

  // Delete page
  deletePage: (pageId: string) => {
    const { legalData, originalLegalData, selectedPageId, editingPageId } =
      get();
    if (!legalData) return;

    const updatedPages = legalData.pages.filter((page) => page.id !== pageId);

    const updatedData: LegalData = {
      ...legalData,
      pages: updatedPages,
    };

    const hasChanges =
      JSON.stringify(updatedData) !== JSON.stringify(originalLegalData);

    set({
      legalData: updatedData,
      hasPendingChanges: hasChanges,
      selectedPageId: selectedPageId === pageId ? null : selectedPageId,
      editingPageId: editingPageId === pageId ? null : editingPageId,
    });
  },

  // Reorder pages
  reorderPages: (pageIds: string[]) => {
    const { legalData, originalLegalData } = get();
    if (!legalData) return;

    const pageMap = new Map(legalData.pages.map((p) => [p.id, p]));
    const reorderedPages = pageIds
      .map((id, index) => {
        const page = pageMap.get(id);
        if (!page) return null;
        return { ...page, order: index + 1 };
      })
      .filter((p): p is LegalPage => p !== null);

    const updatedData: LegalData = {
      ...legalData,
      pages: reorderedPages,
    };

    const hasChanges =
      JSON.stringify(updatedData) !== JSON.stringify(originalLegalData);

    set({
      legalData: updatedData,
      hasPendingChanges: hasChanges,
    });
  },

  // Save all pending changes
  saveAll: async () => {
    const { legalData, legalSha, originalLegalData } = get();

    if (!legalData) {
      throw new Error("Legal data not loaded. Please refresh.");
    }

    const hasChanges =
      JSON.stringify(legalData) !== JSON.stringify(originalLegalData);

    if (!hasChanges) {
      set({
        feedback: {
          type: "success",
          message: "No changes to save.",
        },
      });
      return;
    }

    try {
      const { repoOwnerFromLink, repoNameFromLink } =
        useOrganizationStore.getState();
      const owner = repoOwnerFromLink || "";
      const repo = repoNameFromLink || "";

      if (!owner || !repo) {
        throw new Error("Repository owner/name missing.");
      }

      set({ isSaving: true, error: null, hasConflict: false });

      // If no SHA, we need to create the file (pass empty string, API will handle)
      const result = await saveLegalData(
        owner,
        repo,
        legalData,
        legalSha || ""
      );

      set({
        legalData: result.legal,
        originalLegalData: result.legal,
        legalSha: result.newSha,
        isSaving: false,
        hasPendingChanges: false,
        feedback: {
          type: "success",
          message: "Legal pages saved successfully.",
        },
      });
    } catch (err) {
      const error = err as Error & { isConflict?: boolean };
      const isConflict = error.isConflict === true;

      set({
        isSaving: false,
        hasConflict: isConflict,
        error: error.message || "Failed to save changes.",
        feedback: {
          type: "error",
          message: error.message || "Failed to save changes.",
        },
      });

      // Don't throw if it's a conflict - let UI handle it
      if (!isConflict) {
        throw err;
      }
    }
  },

  // Discard all pending changes
  discardChanges: () => {
    const { originalLegalData } = get();
    if (!originalLegalData) return;

    set({
      legalData: JSON.parse(JSON.stringify(originalLegalData)),
      hasPendingChanges: false,
      hasConflict: false,
      editingPageId: null,
      feedback: {
        type: "success",
        message: "All changes discarded.",
      },
    });
  },

  // Refresh and retry after conflict
  refreshAndRetry: async () => {
    const { legalData } = get();

    // Store current draft changes
    const draftLegal = legalData
      ? JSON.parse(JSON.stringify(legalData))
      : null;

    // Fetch fresh data
    await get().fetchData();

    // Re-apply draft changes on top of fresh data
    if (draftLegal) {
      set({
        legalData: draftLegal,
        hasPendingChanges: true,
      });
    }

    // Clear conflict flag and retry save
    set({ hasConflict: false });
    await get().saveAll();
  },

  clearError: () => {
    set({ error: null });
  },

  clearFeedback: () => {
    set({ feedback: null });
  },
}));
