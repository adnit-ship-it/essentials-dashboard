/**
 * Media service for fetching and saving media.json data
 */

import type { MediaData } from "@/lib/types/media"

// Use relative URLs in browser to avoid CORS issues
const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")

export interface MediaDataResponse {
  media: MediaData
  sha: string
}

/**
 * Fetches media.json data from the API
 */
export async function fetchMediaData(
  owner: string,
  repo: string
): Promise<MediaDataResponse> {
  if (!owner || !repo) {
    throw new Error("Repository owner/name missing. Configure via organization settings.")
  }

  const url = `${API_BASE_URL}/api/media?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      error.error || `Failed to fetch media data: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  return {
    media: data.media || {},
    sha: data.sha || "",
  }
}

/**
 * Saves media.json data to the API
 */
export async function saveMediaData(
  owner: string,
  repo: string,
  media: MediaData,
  sha?: string
): Promise<{ newSha: string; media: MediaData }> {
  if (!owner || !repo) {
    throw new Error("Repository owner/name missing. Configure via organization settings.")
  }

  const url = `${API_BASE_URL}/api/media?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      media,
      sha,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (response.status === 409) {
      const conflictError = new Error(
        error.error || "The media file was modified by someone else. Please refresh and try again."
      ) as Error & { isConflict: boolean }
      conflictError.isConflict = true
      throw conflictError
    }
    throw new Error(
      error.error || `Failed to save media data: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  return {
    newSha: data.sha || sha,
    media: data.media || media,
  }
}
