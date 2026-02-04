/**
 * Utilities for resolving brand color names to hex values
 */

import { useState, useEffect } from "react"
import type { BrandingColors } from "@/lib/types/branding"

export const DEFAULT_BRAND_COLORS: BrandingColors = {
  backgroundColor: "#FFFFFF",
  bodyColor: "#000000",
  accentColor1: "#FF6B35",
  accentColor2: "#004E89",
}

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
 * Hook to fetch brand colors from API
 */
export function useBrandColors(
  repoOwner?: string | null,
  repoName?: string | null
): { colors: BrandingColors | null; loading: boolean } {
  const [colors, setColors] = useState<BrandingColors | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!repoOwner || !repoName) {
      setColors(null)
      setLoading(false)
      return
    }

    const fetchBrandColors = async () => {
      try {
        const API_BASE_URL =
          typeof window !== "undefined"
            ? ""
            : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        const response = await fetch(
          `${API_BASE_URL}/api/branding?owner=${encodeURIComponent(repoOwner)}&repo=${encodeURIComponent(repoName)}`
        )

        if (response.ok) {
          const data = await response.json()
          if (data.colors) {
            setColors(data.colors)
          } else {
            setColors(DEFAULT_BRAND_COLORS)
          }
        } else {
          // Use default colors on error
          setColors(DEFAULT_BRAND_COLORS)
        }
      } catch (error) {
        console.error("Failed to fetch brand colors:", error)
        setColors(DEFAULT_BRAND_COLORS)
      } finally {
        setLoading(false)
      }
    }

    fetchBrandColors()
  }, [repoOwner, repoName])

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
