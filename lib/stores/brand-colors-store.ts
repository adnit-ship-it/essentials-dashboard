/**
 * Brand colors store.
 * Single source of truth for brand colors, shared across all components.
 * Updated on fetch and when colors are saved from any entry point.
 */

import { create } from "zustand"
import { useOrganizationStore } from "./organization-store"
import type { BrandingColors } from "@/lib/types/branding"

export const DEFAULT_BRAND_COLORS: BrandingColors = {
  backgroundColor: "#FFFFFF",
  bodyColor: "#000000",
  accentColor1: "#FF6B35",
  accentColor2: "#004E89",
}

const API_BASE_URL =
  typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")

function makeRepoKey(owner: string, repo: string): string {
  return owner && repo ? `${owner}/${repo}` : ""
}

interface BrandColorsStore {
  colors: BrandingColors | null
  designTokensSha: string | null
  loading: boolean
  repoKey: string | null
  fetchBrandColors: () => Promise<void>
  setBrandColors: (colors: BrandingColors, sha?: string) => void
  clearIfRepoChanged: () => void
}

export const useBrandColorsStore = create<BrandColorsStore>((set, get) => ({
  colors: null,
  designTokensSha: null,
  loading: true,
  repoKey: null,

  fetchBrandColors: async () => {
    const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore.getState()
    const owner = repoOwnerFromLink || ""
    const repo = repoNameFromLink || ""
    const newRepoKey = makeRepoKey(owner, repo)

    if (!owner || !repo) {
      set({ colors: null, designTokensSha: null, loading: false, repoKey: null })
      return
    }

    // Clear if repo changed to avoid showing stale data
    const { repoKey } = get()
    if (repoKey && repoKey !== newRepoKey) {
      set({ colors: null, designTokensSha: null, loading: true, repoKey: null })
    } else {
      set({ loading: true })
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/branding?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      )

      if (response.ok) {
        const data = await response.json()
        const colors = data.colors ? data.colors : DEFAULT_BRAND_COLORS
        const designTokensSha = data.sha ?? null
        set({ colors, designTokensSha, loading: false, repoKey: newRepoKey })
      } else {
        set({ colors: DEFAULT_BRAND_COLORS, designTokensSha: null, loading: false, repoKey: newRepoKey })
      }
    } catch (error) {
      console.error("Failed to fetch brand colors:", error)
      set({ colors: DEFAULT_BRAND_COLORS, designTokensSha: null, loading: false, repoKey: newRepoKey })
    }
  },

  setBrandColors: (colors, sha) => {
    const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore.getState()
    const currentRepoKey = makeRepoKey(repoOwnerFromLink || "", repoNameFromLink || "")
    const { repoKey } = get()
    // Only update if we're setting colors for the current repo
    if (repoKey === currentRepoKey || !repoKey) {
      set({
        colors,
        designTokensSha: sha ?? get().designTokensSha,
        loading: false,
        repoKey: currentRepoKey || repoKey,
      })
    }
  },

  clearIfRepoChanged: () => {
    const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore.getState()
    const currentRepoKey = makeRepoKey(repoOwnerFromLink || "", repoNameFromLink || "")
    const { repoKey } = get()
    if (repoKey && repoKey !== currentRepoKey) {
      set({ colors: null, designTokensSha: null, loading: true, repoKey: null })
    }
  },
}))
