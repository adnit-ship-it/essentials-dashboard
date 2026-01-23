"use client"

import { Button } from "@/components/ui/button"
import { useBrandColors, resolveBrandColor, getTextColorForBackground } from "@/lib/utils/brand-colors"
import {
  hasImageSource,
  extractColorProperties,
  formatPropertyName,
  normalizeTemplateName,
} from "@/lib/utils/component-value-formatter"
import { formatComponentNameForEdit } from "./shared/format-component-name"
import type { BasePreviewProps } from "./shared/preview-props"

export function ColorMediaPreview({
  componentKey,
  value,
  onClick,
  templateName,
  repoOwner,
  repoName,
}: BasePreviewProps) {
  const templateType = normalizeTemplateName(templateName ?? null)
  const { colors: brandColors, loading } = useBrandColors(repoOwner, repoName)
  const componentName = formatComponentNameForEdit(componentKey)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  // Safety check: verify no images exist
  if (hasImageSource(value, templateType)) {
    // This shouldn't happen if MediaPreview logic is correct, but handle gracefully
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="text-sm text-muted-foreground text-center transition-all group-hover:blur-sm">
          Unexpected: Images detected
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

  // Extract color properties
  const colorProperties = extractColorProperties(value)

  // Handle empty state
  if (colorProperties.length === 0) {
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="text-xl font-semibold text-foreground text-center transition-all group-hover:blur-sm" onClick={onClick}>
          No Colors
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

  return (
    <div className="group relative w-full h-full flex flex-col cursor-pointer rounded-md overflow-hidden">
      {/* Content wrapper with blur on hover */}
      <div className="w-full h-full flex flex-col transition-all group-hover:blur-sm" onClick={onClick}>
        {colorProperties.map(({ propertyName, color }, index) => {
          const resolvedColor = resolveBrandColor(color, brandColors)
          const textColor = getTextColorForBackground(resolvedColor, brandColors)
          const formattedName = formatPropertyName(propertyName)

          return (
            <div
              key={`${propertyName}-${index}`}
              className="flex-1 min-h-[60px] flex items-center justify-center"
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
