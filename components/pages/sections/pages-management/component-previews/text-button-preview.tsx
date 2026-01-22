"use client"

import { getTextValue, getColorValueForDisplay, formatPropertyName } from "@/lib/utils/component-value-formatter"
import { useBrandColors, resolveBrandColor, getTextColorForBackground } from "@/lib/utils/brand-colors"
import type { BasePreviewProps } from "./shared/preview-props"

export function TextButtonPreview({
  componentKey,
  value,
  onClick,
  repoOwner,
  repoName,
}: BasePreviewProps) {
  const { colors: brandColors, loading } = useBrandColors(repoOwner, repoName)
  const textValue = getTextValue(value, componentKey)
  const colorValue = getColorValueForDisplay(value, componentKey) || "bodyColor"

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

  // Resolve color to hex value
  const resolvedColor = resolveBrandColor(colorValue, brandColors)

  // Calculate text color for contrast
  const bottomStripTextColor = getTextColorForBackground(resolvedColor, brandColors)

  // Format color name for display
  const colorNameForDisplay = colorValue.startsWith("#")
    ? colorValue
    : formatPropertyName(colorValue)

  return (
    <div
      className="w-full h-full flex flex-col cursor-pointer transition-opacity hover:opacity-90 rounded-md overflow-hidden"
      onClick={onClick}
    >
      {/* Top strip: Text value */}
      <div className="flex-1 flex items-center justify-center bg-muted">
        {textValue ? (
          <div className="text-xl font-semibold line-clamp-2 text-foreground text-center px-4">
            {textValue}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center px-4">
            No text
          </div>
        )}
      </div>

      {/* Bottom strip: Color with color name */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{
          backgroundColor: resolvedColor,
          color: bottomStripTextColor,
        }}
      >
        <span className="text-lg font-medium text-center px-4">
          {colorNameForDisplay}
        </span>
      </div>
    </div>
  )
}
