import { assetSrcToRepoPath } from "./repo-paths"

const DEFAULT_PRIMARY = "public/assets/images/brand/logo.svg"
const DEFAULT_SECONDARY = "public/assets/images/brand/logo-alt.svg"

/**
 * Derives brandLogoPath and brandAltLogoPath from media.json logoRegistry.
 * Uses primary and secondary logo paths; falls back to defaults if missing.
 */
export function deriveLogoPathsFromMedia(
  media: { logoRegistry?: Record<string, { path?: string; type?: string }> } | null
): {
  brandLogoPath: string
  brandAltLogoPath: string
} {
  const primary = media?.logoRegistry?.primary?.path
  const secondary = media?.logoRegistry?.secondary?.path
  return {
    brandLogoPath: assetSrcToRepoPath(primary) || DEFAULT_PRIMARY,
    brandAltLogoPath: assetSrcToRepoPath(secondary) || DEFAULT_SECONDARY,
  }
}
