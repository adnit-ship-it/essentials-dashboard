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





