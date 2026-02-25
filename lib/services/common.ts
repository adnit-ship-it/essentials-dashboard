/**
 * Common service for fetching and saving common.json data
 */

import type { CommonData } from "@/lib/types/common"

// Use relative URLs in browser to avoid CORS issues
const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")

export interface CommonDataResponse {
  common: CommonData
  sha: string
}

/**
 * Fetches common.json data from the API
 */
export async function fetchCommonData(
  owner: string,
  repo: string
): Promise<CommonDataResponse> {
  if (!owner || !repo) {
    throw new Error("Repository owner/name missing. Configure via organization settings.")
  }

  const url = `${API_BASE_URL}/api/common?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      error.error || `Failed to fetch common data: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  return {
    common: data.common || {},
    sha: data.sha || "",
  }
}

/**
 * Saves common.json data to the API
 */
export async function saveCommonData(
  owner: string,
  repo: string,
  common: CommonData,
  sha?: string
): Promise<{ newSha: string; common: CommonData }> {
  if (!owner || !repo) {
    throw new Error("Repository owner/name missing. Configure via organization settings.")
  }

  const url = `${API_BASE_URL}/api/common?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      common,
      sha,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (response.status === 409) {
      const conflictError = new Error(
        error.error || "The common file was modified by someone else. Please refresh and try again."
      ) as Error & { isConflict: boolean }
      conflictError.isConflict = true
      throw conflictError
    }
    throw new Error(
      error.error || `Failed to save common data: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  return {
    newSha: data.sha || sha,
    common: data.common || common,
  }
}
