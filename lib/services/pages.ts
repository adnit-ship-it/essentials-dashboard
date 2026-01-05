/**
 * Pages service for fetching and saving Pages.json data
 */

import type { PagesData } from "@/lib/types/pages"

// Use relative URLs in browser to avoid CORS issues
const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")

export interface PagesDataResponse {
  pages: PagesData
  sha: string
}

export type ErrorType = 'repo_not_found' | 'file_not_found' | 'permission_error' | 'network_error' | 'conflict_error' | 'unknown_error'

export interface StructuredError extends Error {
  type: ErrorType
  statusCode?: number
}

/**
 * Fetches Pages.json data from the API
 */
export async function fetchPagesData(
  owner: string,
  repo: string
): Promise<PagesDataResponse> {
  if (!owner || !repo) {
    throw new Error("Repository owner/name missing. Configure via organization settings.")
  }

  const url = `${API_BASE_URL}/api/pages?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const errorMessage = error.error || `Failed to fetch pages data: ${response.status} ${response.statusText}`
    
    let errorType: ErrorType = 'unknown_error'
    if (response.status === 404) {
      // Check if it's a repo not found or file not found
      if (errorMessage.toLowerCase().includes('repository') || errorMessage.toLowerCase().includes('not found')) {
        errorType = 'repo_not_found'
      } else {
        errorType = 'file_not_found'
      }
    } else if (response.status === 403) {
      errorType = 'permission_error'
    } else if (response.status >= 500) {
      errorType = 'network_error'
    }
    
    const structuredError = new Error(errorMessage) as StructuredError
    structuredError.type = errorType
    structuredError.statusCode = response.status
    throw structuredError
  }

  const data = await response.json()
  return {
    pages: data.pages || {},
    sha: data.sha || "",
  }
}

/**
 * Saves Pages.json data to the API
 */
export async function savePagesData(
  owner: string,
  repo: string,
  pages: PagesData,
  sha: string
): Promise<{ newSha: string; pages: PagesData }> {
  if (!owner || !repo) {
    throw new Error("Repository owner/name missing. Configure via organization settings.")
  }

  if (!sha) {
    throw new Error("Missing pages file SHA. Refresh and try again.")
  }

  const url = `${API_BASE_URL}/api/pages?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pages,
      sha,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    
    // Handle 409 Conflict specifically
    if (response.status === 409) {
      const conflictError = new Error(
        error.error || "The pages file was modified by someone else. Please refresh and try again."
      ) as Error & { isConflict: boolean }
      conflictError.isConflict = true
      throw conflictError
    }
    
    throw new Error(
      error.error || `Failed to save pages data: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  return {
    newSha: data.sha || sha,
    pages: data.pages || pages,
  }
}

