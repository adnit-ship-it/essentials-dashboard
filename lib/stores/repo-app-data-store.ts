/**
 * Repo-scoped app data store.
 * Single fetch, single source of truth for data needed by multiple components
 * (e.g. hostTemplate.json: templateName, hostedAt).
 */

import { create } from "zustand"
import { useOrganizationStore } from "./organization-store"

const API_BASE_URL =
  typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")

export type HostTemplateInfo = { templateName: string; hostedAt: string }

interface RepoAppDataStore {
  hostTemplateInfo: HostTemplateInfo | null
  fetchRepoAppData: () => Promise<void>
  setHostTemplateInfo: (info: HostTemplateInfo | null) => void
}

export const useRepoAppDataStore = create<RepoAppDataStore>((set) => ({
  hostTemplateInfo: null,

  fetchRepoAppData: async () => {
    const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore.getState()
    const owner = repoOwnerFromLink || ""
    const repo = repoNameFromLink || ""

    if (!owner || !repo) {
      set({ hostTemplateInfo: null })
      return
    }

    // Clear before fetch to avoid showing stale data when switching repos
    set({ hostTemplateInfo: null })

    try {
      const url = `${API_BASE_URL}/api/host-template?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      const res = await fetch(url)

      if (res.status === 404) {
        set({ hostTemplateInfo: null })
        return
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch host template: ${res.status}`)
      }

      const data = await res.json()
      if (data?.templateName !== undefined) {
        set({
          hostTemplateInfo: {
            templateName: data.templateName || "",
            hostedAt: data.hostedAt || "",
          },
        })
      } else {
        set({ hostTemplateInfo: null })
      }
    } catch (err) {
      console.error("Error fetching repo app data:", err)
      set({ hostTemplateInfo: null })
    }
  },

  setHostTemplateInfo: (info) => {
    set({ hostTemplateInfo: info })
  },
}))
