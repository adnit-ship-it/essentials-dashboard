/**
 * Utilities for converting between repository paths and asset URLs
 */

/**
 * Normalizes a repository path input, ensuring it starts with "public/"
 * @param value - The input path value
 * @param fallback - Default path if value is empty
 * @returns Normalized repository path
 */
export function normalizeRepoPathInput(value: string, fallback: string): string {
  const trimmed = (value || "").trim()
  if (!trimmed) {
    return fallback
  }
  const withoutLeadingSlash = trimmed.replace(/^\/+/, "")
  if (withoutLeadingSlash.startsWith("public/")) {
    return withoutLeadingSlash
  }
  if (withoutLeadingSlash.startsWith("assets/")) {
    return `public/${withoutLeadingSlash}`
  }
  return `public/${withoutLeadingSlash}`
}

/**
 * Converts an asset src URL to a repository path
 * @param src - The asset source URL (e.g., "/assets/images/logo.svg")
 * @returns Repository path (e.g., "public/assets/images/logo.svg") or null
 */
export function assetSrcToRepoPath(src?: string | null): string | null {
  if (!src || typeof src !== "string") return null
  const trimmed = src.trim()
  if (!trimmed) return null
  const withoutLeadingSlash = trimmed.replace(/^\/+/, "")
  if (withoutLeadingSlash.startsWith("public/")) {
    return withoutLeadingSlash
  }
  return `public/${withoutLeadingSlash}`
}

/**
 * Converts a repository path to an asset src URL
 * @param repoPath - The repository path (e.g., "public/assets/images/logo.svg")
 * @returns Asset src URL (e.g., "/assets/images/logo.svg")
 */
export function repoPathToAssetSrc(repoPath: string): string {
  if (!repoPath) return ""
  const withoutPublic = repoPath.replace(/^public\/+/, "")
  return `/${withoutPublic.replace(/^\/+/, "")}`
}

/**
 * Converts a content repo image path to a GitHub raw URL
 * @param imagePath - The image path from content repo (e.g., "/assets/images/logo.svg" or "public/assets/images/logo.svg")
 * @param repoOwner - GitHub repository owner
 * @param repoName - GitHub repository name
 * @param branch - Repository branch (defaults to "main")
 * @returns GitHub raw URL or original path if repo info is missing
 */
export function convertContentRepoPathToRawUrl(
  imagePath: string | null | undefined,
  repoOwner?: string | null,
  repoName?: string | null,
  branch: string = "main"
): string | null {
  if (!imagePath) return null
  
  // If already a full URL, return as-is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath
  }
  
  // If we don't have repo info, return null (can't construct URL)
  if (!repoOwner || !repoName) {
    return null
  }
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath
  
  // Ensure it starts with "public/" if it's an asset path
  const repoPath = cleanPath.startsWith("public/") ? cleanPath : `public/${cleanPath}`
  
  // Encode the path for URL
  const encodedPath = encodeURIComponent(repoPath)
  
  // Construct GitHub raw URL
  return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${encodedPath}`
}





