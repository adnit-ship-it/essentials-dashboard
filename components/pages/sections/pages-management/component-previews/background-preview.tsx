"use client"

import { useBrandColors, resolveBrandColor, getTextColorForBackground } from "@/lib/utils/brand-colors"
import { getColorValueForDisplay, formatPropertyName } from "@/lib/utils/component-value-formatter"
import type { BasePreviewProps } from "./shared/preview-props"

export function BackgroundPreview({
  componentKey,
  value,
  onClick,
  repoOwner,
  repoName,
}: BasePreviewProps) {
  const { colors: brandColors, loading } = useBrandColors(repoOwner, repoName)

  // Extract color value
  const colorValue = getColorValueForDisplay(value, componentKey)

  // Handle loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground text-center">
          Loading colors...
        </div>
      </div>
    )
  }

  // Handle no color case
  if (!colorValue) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-xl font-semibold text-foreground text-center">
          Color not set
        </div>
      </div>
    )
  }

  // Resolve color to hex value
  const resolvedColor = resolveBrandColor(colorValue, brandColors)

  // Calculate text color for contrast
  const textColor = getTextColorForBackground(resolvedColor, brandColors)

  // Format color name for display
  // For hex colors, show as-is. For brand/CSS color names, format them
  let displayName = colorValue
  if (colorValue.startsWith("#")) {
    // Show hex color as-is
    displayName = colorValue
  } else {
    // Format brand color names and CSS color names
    displayName = formatPropertyName(colorValue)
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90"
      onClick={onClick}
      style={{
        backgroundColor: resolvedColor,
        color: textColor,
      }}
    >
      <span className="text-lg font-medium text-center px-4">
        {displayName}
      </span>
    </div>
  )
}
