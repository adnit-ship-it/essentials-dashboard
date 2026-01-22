"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { convertContentRepoPathToRawUrl } from "@/lib/utils/repo-paths"
import { getCardTitle, getColorValueForDisplay } from "@/lib/utils/component-value-formatter"
import { ColorSwatch } from "./shared/color-swatch"
import type { BasePreviewProps } from "./shared/preview-props"

export function InfoCardWithBulletpointsPreview({
  componentKey,
  value,
  onClick,
  repoOwner,
  repoName,
  repoBranch = "main",
}: BasePreviewProps) {
  const [iconError, setIconError] = useState(false)

  // Extract card title
  const title = getCardTitle(value, componentKey)
  const colorValue = getColorValueForDisplay(value, componentKey)

  // Extract bulletpoints array
  const bulletpoints = Array.isArray(value?.bulletpoints) ? value.bulletpoints : []

  // Find first bulletpoint with showIcon: true, or first bulletpoint if none have showIcon
  const firstBulletpointWithIcon = bulletpoints.find((bp: any) => bp?.showIcon !== false) || bulletpoints[0]
  const firstBulletpointText = firstBulletpointWithIcon?.text || null
  const shouldShowIcon = firstBulletpointWithIcon?.showIcon !== false

  // Extract icon info
  const iconSrc = value?.bulletpointIcon?.src || ""
  const iconColor = value?.bulletpointIcon?.color || "accentColor1"

  // Calculate remaining count
  const totalCount = bulletpoints.length
  const remainingCount = totalCount > 1 ? totalCount - 1 : 0

  // Convert icon path to GitHub raw URL if needed
  const displayIconSrc = iconSrc && shouldShowIcon
    ? convertContentRepoPathToRawUrl(iconSrc, repoOwner, repoName, repoBranch) || iconSrc
    : null

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  const handleColorSwatchClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  // If no bulletpoints, fallback to standard card preview
  if (bulletpoints.length === 0 || !firstBulletpointText) {
    return (
      <div className="space-y-3">
        <div className="text-xl font-semibold line-clamp-1 text-foreground">
          {title}
        </div>
        {colorValue && (
          <ColorSwatch colorValue={colorValue} onClick={handleColorSwatchClick} />
        )}
      </div>
    )
  }

  // Show card title + first bulletpoint with icon
  return (
    <div className="group relative w-full h-full space-y-3 flex flex-col items-center justify-center ">
      <div className="text-xl font-semibold line-clamp-1 text-foreground">
        {title}
      </div>
      {colorValue && (
        <ColorSwatch colorValue={colorValue} onClick={handleColorSwatchClick} />
      )}
      <div className="relative w-full ">
        <div className="w-full flex items-center justify-center gap-3 p-2 rounded-md transition-all group-hover:opacity-70">
          {displayIconSrc && !iconError && shouldShowIcon && (
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <img
                src={displayIconSrc}
                alt="Bulletpoint icon"
                className="w-full h-full object-contain"
                onError={() => setIconError(true)}
                loading="lazy"
              />
            </div>
          )}
          <div className="text-sm font-medium text-foreground line-clamp-2 flex-1 min-w-0">
            {firstBulletpointText}
          </div>
        </div>
        {remainingCount > 0 && (
          <div className="absolute inset-0 top-auto hidden group-hover:flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-md">
            <Button
              variant="default"
              size="sm"
              onClick={handleButtonClick}
              className="pointer-events-auto"
            >
              {remainingCount} more bulletpoint{remainingCount !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
