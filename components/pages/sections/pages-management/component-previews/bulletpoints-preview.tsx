"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { convertContentRepoPathToRawUrl } from "@/lib/utils/repo-paths"
import { getArrayDisplayText, normalizeTemplateName } from "@/lib/utils/component-value-formatter"
import { formatComponentNameForEdit } from "./shared/format-component-name"
import type { BasePreviewProps } from "./shared/preview-props"

export function BulletPointsPreview({
  componentKey,
  value,
  onClick,
  templateName,
  repoOwner,
  repoName,
  repoBranch = "main",
}: BasePreviewProps) {
  const [iconError, setIconError] = useState(false)
  const templateType = normalizeTemplateName(templateName ?? null)

  // Extract items array
  const items = Array.isArray(value?.items) ? value.items : []
  const firstItem = items.length > 0 ? items[0] : null

  // Extract icon info
  const iconSrc = value?.icon?.src || ""
  const iconColor = value?.icon?.color || "accentColor1"

  // Calculate remaining count
  const totalCount = items.length
  const remainingCount = totalCount > 1 ? totalCount - 1 : 0

  // Convert icon path to GitHub raw URL if needed
  const displayIconSrc = iconSrc
    ? convertContentRepoPathToRawUrl(iconSrc, repoOwner, repoName, repoBranch) || iconSrc
    : null

  // Fallback text
  const fallbackText = getArrayDisplayText(value, componentKey, templateType) || "0 Bulletpoints"
  const componentName = formatComponentNameForEdit(componentKey)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  // Determine button text
  const buttonText = remainingCount > 0
    ? `Edit ${componentName} (${remainingCount} more bulletpoint${remainingCount !== 1 ? "s" : ""})`
    : `Edit ${componentName}`

  // If no items, show fallback
  if (!firstItem || totalCount === 0) {
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="text-xl font-semibold text-foreground transition-all group-hover:blur-sm" onClick={onClick}>
          {fallbackText}
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

  // If no icon or icon failed to load, show text only
  if (!displayIconSrc || iconError) {
    return (
      <div className="group relative w-full h-full cursor-pointer rounded-md overflow-hidden">
        <div className="w-full h-full flex items-center gap-2 p-2 rounded-md transition-all group-hover:blur-sm" onClick={onClick}>
          <div className="text-base font-medium text-foreground line-clamp-2 flex-1">
            {firstItem}
          </div>
        </div>
        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center backdrop-blur-sm">
          <Button
            variant="default"
            size="sm"
            onClick={handleButtonClick}
            className="pointer-events-auto"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    )
  }

  // Show first item with icon
  return (
    <div className="group relative w-full h-full cursor-pointer rounded-md overflow-hidden">
      <div className="w-full h-full flex items-center gap-3 p-3 rounded-md transition-all group-hover:blur-sm" onClick={onClick}>
        {displayIconSrc && !iconError && (
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            <img
              src={displayIconSrc}
              alt="Bulletpoint icon"
              className="w-full h-full object-contain"
              onError={() => setIconError(true)}
              loading="lazy"
            />
          </div>
        )}
        <div className="text-base font-medium text-foreground line-clamp-2 flex-1 min-w-0">
          {firstItem}
        </div>
      </div>
      <div className="absolute inset-0 hidden group-hover:flex items-center justify-center backdrop-blur-sm">
        <Button
          variant="default"
          size="sm"
          onClick={handleButtonClick}
          className="pointer-events-auto"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  )
}
