"use client"

import { Button } from "@/components/ui/button"
import { useBrandColors, resolveBrandColor, getTextColorForBackground } from "@/lib/utils/brand-colors"
import { formatPropertyName } from "@/lib/utils/component-value-formatter"
import { formatComponentNameForEdit } from "./shared/format-component-name"
import type { BasePreviewProps } from "./shared/preview-props"

export function ButtonPreview({
  componentKey,
  value,
  onClick,
  repoOwner,
  repoName,
}: BasePreviewProps) {
  const { colors: brandColors, loading } = useBrandColors(repoOwner, repoName)

  // Extract button properties
  const buttonText = value?.text || ""
  const textColor = value?.color || "accentColor1"
  const backgroundColor = value?.backgroundColor || null
  const show = value?.show !== false

  const componentName = formatComponentNameForEdit(componentKey)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  // Handle loading state
  if (loading) {
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="text-sm text-muted-foreground text-center transition-all group-hover:blur-sm">
          Loading colors...
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

  // Resolve colors
  const resolvedTextColor = resolveBrandColor(textColor, brandColors)
  const resolvedBackgroundColor = backgroundColor
    ? resolveBrandColor(backgroundColor, brandColors)
    : null

  // Handle buttons with backgroundColor (full card fill)
  if (resolvedBackgroundColor) {
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md overflow-hidden">
        {/* Content wrapper with blur on hover */}
        <div
          className="w-full h-full flex items-center justify-center transition-all group-hover:blur-sm"
          onClick={onClick}
          style={{
            backgroundColor: resolvedBackgroundColor,
            color: resolvedTextColor,
          }}
        >
          <span className="text-lg font-medium text-center px-4">
            {buttonText || "Button"}
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

  // Handle buttons without backgroundColor (split into 2 strips)
  const resolvedColor = resolvedTextColor
  const colorNameForDisplay = textColor.startsWith("#")
    ? textColor
    : formatPropertyName(textColor)
  const bottomStripTextColor = getTextColorForBackground(resolvedColor, brandColors)

  return (
    <div className="group relative w-full h-full flex flex-col cursor-pointer rounded-md overflow-hidden">
      {/* Content wrapper with blur on hover */}
      <div className="w-full h-full flex flex-col transition-all group-hover:blur-sm" onClick={onClick}>
        {/* Top strip: Button text */}
        <div className="flex-1 flex items-center justify-center bg-muted">
          <span className="text-lg font-medium text-center px-4 text-foreground">
            {buttonText || "Button"}
          </span>
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
