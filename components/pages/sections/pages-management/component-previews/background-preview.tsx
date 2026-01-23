"use client"

import { Button } from "@/components/ui/button"
import { useBrandColors, resolveBrandColor, getTextColorForBackground } from "@/lib/utils/brand-colors"
import { getColorValueForDisplay, formatPropertyName } from "@/lib/utils/component-value-formatter"
import { formatComponentNameForEdit } from "./shared/format-component-name"
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

  const componentName = formatComponentNameForEdit(componentKey)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  // Handle no color case
  if (!colorValue) {
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="text-xl font-semibold text-foreground text-center transition-all group-hover:blur-sm">
          Color not set
        </div>
        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center backdrop-blur-sm">
          <Button
            variant="default"
            size="sm"
            onClick={handleButtonClick}
            className="pointer-events-auto"
          >
            Edit {componentName}
          </Button>
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
    <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md overflow-hidden">
      {/* Content wrapper with blur on hover */}
      <div
        className="w-full h-full flex items-center justify-center transition-all group-hover:blur-sm"
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

      {/* Hover overlay */}
      <div className="absolute inset-0 hidden group-hover:flex items-center justify-center backdrop-blur-sm">
        <Button
          variant="default"
          size="sm"
          onClick={handleButtonClick}
          className="pointer-events-auto"
        >
          Edit {componentName}
        </Button>
      </div>
    </div>
  )
}
