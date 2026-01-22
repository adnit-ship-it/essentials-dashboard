"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { convertContentRepoPathToRawUrl } from "@/lib/utils/repo-paths"
import { getCardTitle, getColorValueForDisplay, formatPropertyName } from "@/lib/utils/component-value-formatter"
import { useBrandColors, resolveBrandColor, getTextColorForBackground } from "@/lib/utils/brand-colors"
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
  const { colors: brandColors, loading } = useBrandColors(repoOwner, repoName)

  // Extract card title
  const title = getCardTitle(value, componentKey)
  const colorValue = getColorValueForDisplay(value, componentKey)

  // Extract bulletpoints array
  const bulletpoints = Array.isArray(value?.bulletpoints) ? value.bulletpoints : []

  // Always use the first bulletpoint, regardless of showIcon property
  const firstBulletpoint = bulletpoints.length > 0 ? bulletpoints[0] : null
  const firstBulletpointText = firstBulletpoint?.text || null
  const shouldShowIcon = firstBulletpoint?.showIcon !== false

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
  const resolvedColor = colorValue ? resolveBrandColor(colorValue, brandColors) : null
  const colorStripTextColor = resolvedColor ? getTextColorForBackground(resolvedColor, brandColors) : null
  const colorNameForDisplay = colorValue
    ? colorValue.startsWith("#")
      ? colorValue
      : formatPropertyName(colorValue)
    : null

  // If no bulletpoints, fallback to standard card preview with color strip
  if (bulletpoints.length === 0 || !firstBulletpointText) {
    return (
      <div
        className="w-full h-full flex flex-col cursor-pointer rounded-md overflow-hidden"
        onClick={onClick}
      >
        <div className="flex-1 flex items-center justify-center bg-muted">
          <div className="text-xl font-semibold line-clamp-1 text-foreground text-center px-4">
            {title || "No title"}
          </div>
        </div>
        {resolvedColor && colorStripTextColor && (
          <div
            className="h-8 flex items-center justify-center"
            style={{
              backgroundColor: resolvedColor,
              color: colorStripTextColor,
            }}
          >
            <span className="text-xs font-medium text-center px-2">
              {colorNameForDisplay}
            </span>
          </div>
        )}
      </div>
    )
  }

  // Show card title + first bulletpoint with icon + color strip
  return (
    <div
      className="group relative w-full h-full flex flex-col cursor-pointer rounded-md overflow-hidden"
      onClick={onClick}
    >
      {/* Content wrapper with blur on hover */}
      <div className="flex-1 flex flex-col transition-all group-hover:blur-sm">
        {/* Title */}
        <div className="text-xl font-semibold line-clamp-1 text-foreground text-center px-4 pt-2">
          {title}
        </div>

        {/* Bulletpoint with icon */}
        <div className="flex-1 flex items-center gap-3 p-2">
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
      </div>

      {/* Color strip at bottom */}
      {resolvedColor && colorStripTextColor && (
        <div
          className="h-8 flex items-center justify-center transition-opacity group-hover:opacity-70"
          style={{
            backgroundColor: resolvedColor,
            color: colorStripTextColor,
          }}
        >
          <span className="text-xs font-medium text-center px-2">
            {colorNameForDisplay}
          </span>
        </div>
      )}

      {/* Hover overlay */}
      {remainingCount > 0 && (
        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/20 backdrop-blur-sm">
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
  )
}
