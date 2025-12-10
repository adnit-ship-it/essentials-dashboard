/**
 * Services for logo registry management
 */

import type { LogoRegistry, LogoRegistryEntry } from "@/lib/types/pages"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

/**
 * Upload or replace a logo file
 */
export async function uploadLogoFile(
  owner: string,
  repo: string,
  filePath: string,
  contentBase64: string,
  existingSha?: string
): Promise<{ newSha: string; fileUrl: string }> {
  const url = `${API_BASE_URL}/api/product-images?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: filePath,
      contentBase64,
      sha: existingSha,
      commitMessage: existingSha
        ? `CMS: Update logo ${filePath}`
        : `CMS: Add logo ${filePath}`,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to upload logo: ${response.statusText}`)
  }

  const result = await response.json()
  return {
    newSha: result.newSha,
    fileUrl: result.fileUrl || filePath,
  }
}

/**
 * Get file SHA if it exists
 */
export async function getFileSha(
  owner: string,
  repo: string,
  filePath: string
): Promise<string | null> {
  try {
    const url = `${API_BASE_URL}/api/assets/metadata?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}`
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 404) {
        return null // File doesn't exist - that's fine
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to get file metadata: ${response.statusText}`)
    }

    const data = await response.json()
    return data.sha || null
  } catch (error: any) {
    // If it's a 404, file doesn't exist - return null
    if (error.status === 404 || error.response?.status === 404 || error.message?.includes("404")) {
      return null
    }
    // Re-throw other errors
    throw error
  }
}

