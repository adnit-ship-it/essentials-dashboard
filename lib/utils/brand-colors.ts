/**
 * Utilities for resolving brand color names to hex values
 */

import { useEffect } from "react"
import type { BrandingColors } from "@/lib/types/branding"
import { useBrandColorsStore } from "@/lib/stores/brand-colors-store"

// Re-export for backward compatibility
export { DEFAULT_BRAND_COLORS } from "@/lib/stores/brand-colors-store"

/**
 * Resolves a color value to a hex color string
 * If it's a brand color name, returns the hex from brandColors
 * If it's already a hex color, returns as-is
 * If brandColors is null, returns the colorValue as-is (fallback)
 */
export function resolveBrandColor(
  colorValue: string,
  brandColors: BrandingColors | null
): string {
  if (!colorValue) return colorValue

  // Check if it's a brand color name
  const brandColorMap: Record<string, keyof BrandingColors> = {
    accentColor1: "accentColor1",
    accentColor2: "accentColor2",
    bodyColor: "bodyColor",
    backgroundColor: "backgroundColor",
  }

  const brandColorKey = brandColorMap[colorValue]
  if (brandColorKey && brandColors) {
    return brandColors[brandColorKey] || colorValue
  }

  // If it's already a hex color, return as-is
  if (colorValue.startsWith("#")) {
    return colorValue
  }

  // Fallback: return the colorValue as-is (might be a CSS color name like "white")
  return colorValue
}

/**
 * Hook to fetch brand colors from API.
 * Subscribes to brand-colors-store; triggers fetch when repo is available.
 */
export function useBrandColors(
  repoOwner?: string | null,
  repoName?: string | null
): { colors: BrandingColors | null; loading: boolean } {
  const colors = useBrandColorsStore((s) => s.colors)
  const loading = useBrandColorsStore((s) => s.loading)
  const fetchBrandColors = useBrandColorsStore((s) => s.fetchBrandColors)

  useEffect(() => {
    if (!repoOwner || !repoName) {
      return
    }
    fetchBrandColors()
  }, [repoOwner, repoName, fetchBrandColors])

  if (!repoOwner || !repoName) {
    return { colors: null, loading: false }
  }

  return { colors, loading }
}

/**
 * Calculate relative luminance of a color
 * Returns a value between 0 (dark) and 1 (light)
 */
function getLuminance(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace("#", "")
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  // Apply gamma correction
  const [rLinear, gLinear, bLinear] = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/**
 * Determine text color (white or black) based on background color
 * Returns "white" for dark backgrounds, "black" for light backgrounds
 */
export function getTextColorForBackground(
  backgroundColor: string,
  brandColors: BrandingColors | null = null
): string {
  // Resolve brand color name to hex if needed
  const resolvedColor = resolveBrandColor(backgroundColor, brandColors)

  // Handle CSS color names (basic ones)
  const cssColorMap: Record<string, string> = {
    white: "#FFFFFF",
    black: "#000000",
    red: "#FF0000",
    green: "#008000",
    blue: "#0000FF",
    yellow: "#FFFF00",
    cyan: "#00FFFF",
    magenta: "#FF00FF",
  }

  let hexColor = resolvedColor
  if (!hexColor.startsWith("#") && cssColorMap[hexColor.toLowerCase()]) {
    hexColor = cssColorMap[hexColor.toLowerCase()]
  }

  // If still not a hex color, default to black text
  if (!hexColor.startsWith("#")) {
    return "black"
  }

  // Calculate luminance
  const luminance = getLuminance(hexColor)

  // Use white text for dark backgrounds (luminance < 0.5), black for light
  return luminance < 0.5 ? "white" : "black"
}
