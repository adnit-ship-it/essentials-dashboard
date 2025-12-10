/**
 * Sections service for fetching and saving Sections.json data
 */

import type { SectionsData } from "@/lib/types/sections"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export interface SectionsDataResponse {
  sections: SectionsData
  sha: string
}

/**
 * Fetches Sections.json data from the API
 */
export async function fetchSectionsData(
  owner: string,
  repo: string
): Promise<SectionsDataResponse> {
  if (!owner || !repo) {
    throw new Error("Repository owner/name missing. Configure via organization settings.")
  }

  const url = `${API_BASE_URL}/api/sections?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      error.error || `Failed to fetch sections data: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  return {
    sections: data.sections || [],
    sha: data.sha || "",
  }
}

/**
 * Saves Sections.json data to the API
 */
export async function saveSectionsData(
  owner: string,
  repo: string,
  sections: SectionsData,
  sha: string
): Promise<{ newSha: string; sections: SectionsData }> {
  if (!owner || !repo) {
    throw new Error("Repository owner/name missing. Configure via organization settings.")
  }

  if (!sha) {
    throw new Error("Missing sections file SHA. Refresh and try again.")
  }

  const url = `${API_BASE_URL}/api/sections?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sections,
      sha,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    
    // Handle 409 Conflict specifically
    if (response.status === 409) {
      const conflictError = new Error(
        error.error || "The sections file was modified by someone else. Please refresh and try again."
      ) as Error & { isConflict: boolean }
      conflictError.isConflict = true
      throw conflictError
    }
    
    throw new Error(
      error.error || `Failed to save sections data: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  return {
    newSha: data.sha || sha,
    sections: data.sections || sections,
  }
}

