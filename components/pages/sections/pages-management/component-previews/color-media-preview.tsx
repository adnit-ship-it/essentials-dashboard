"use client"

import { useBrandColors, resolveBrandColor, getTextColorForBackground } from "@/lib/utils/brand-colors"
import {
  hasImageSource,
  extractColorProperties,
  formatPropertyName,
  normalizeTemplateName,
} from "@/lib/utils/component-value-formatter"
import type { BasePreviewProps } from "./shared/preview-props"

export function ColorMediaPreview({
  value,
  onClick,
  templateName,
  repoOwner,
  repoName,
}: BasePreviewProps) {
  const templateType = normalizeTemplateName(templateName ?? null)
  const { colors: brandColors, loading } = useBrandColors(repoOwner, repoName)

  // Safety check: verify no images exist
  if (hasImageSource(value, templateType)) {
    // This shouldn't happen if MediaPreview logic is correct, but handle gracefully
    return (
      <div className="text-sm text-muted-foreground text-center">
        Unexpected: Images detected
      </div>
    )
  }

  // Extract color properties
  const colorProperties = extractColorProperties(value)

  // Handle empty state
  if (colorProperties.length === 0) {
    return (
      <div className="text-xl font-semibold text-foreground text-center">
        No Colors
      </div>
    )
  }

  // Handle loading state
  if (loading) {
    return (
      <div className="text-sm text-muted-foreground text-center">
        Loading colors...
      </div>
    )
  }

  return (
    <div
      className="w-full h-full flex flex-col cursor-pointer"
      onClick={onClick}
    >
      {colorProperties.map(({ propertyName, color }, index) => {
        const resolvedColor = resolveBrandColor(color, brandColors)
        const textColor = getTextColorForBackground(resolvedColor, brandColors)
        const formattedName = formatPropertyName(propertyName)

        return (
          <div
            key={`${propertyName}-${index}`}
            className="flex-1 min-h-[60px] flex items-center justify-center transition-opacity hover:opacity-80"
            style={{
              backgroundColor: resolvedColor,
              color: textColor,
            }}
          >
            <span className="text-sm font-medium text-center px-2">
              {formattedName}
            </span>
          </div>
        )
      })}
    </div>
  )
}
