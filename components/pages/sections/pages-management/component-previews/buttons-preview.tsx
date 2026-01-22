"use client"

import { Button } from "@/components/ui/button"
import { useBrandColors, resolveBrandColor } from "@/lib/utils/brand-colors"
import type { BasePreviewProps } from "./shared/preview-props"

export function ButtonsPreview({
  componentKey,
  value,
  onClick,
  repoOwner,
  repoName,
}: BasePreviewProps) {
  const { colors: brandColors, loading } = useBrandColors(repoOwner, repoName)

  // Extract buttons array
  const buttons = Array.isArray(value) ? value : []
  const totalCount = buttons.length

  // Get first 3 buttons
  const displayButtons = buttons.slice(0, 3)
  const remainingCount = totalCount > 3 ? totalCount - 3 : 0

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

  // Handle empty array
  if (totalCount === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-xl font-semibold text-foreground text-center">
          No buttons
        </div>
      </div>
    )
  }

  // Determine hover text
  const hoverText = remainingCount > 0
    ? `${remainingCount} more button${remainingCount !== 1 ? "s" : ""}`
    : "Edit buttons"

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <div
      className="group relative w-full h-full flex flex-col cursor-pointer rounded-md overflow-hidden"
      onClick={onClick}
    >
      {/* Display up to 3 button stripes */}
      {displayButtons.map((button: any, index: number) => {
        const buttonText = button?.text || "Button"
        const textColor = button?.color || "accentColor1"
        const backgroundColor = button?.backgroundColor || "accentColor1"

        // Resolve colors
        const resolvedTextColor = resolveBrandColor(textColor, brandColors)
        const resolvedBackgroundColor = resolveBrandColor(backgroundColor, brandColors)

        return (
          <div
            key={index}
            className="flex-1 flex items-center justify-center transition-opacity group-hover:opacity-70"
            style={{
              backgroundColor: resolvedBackgroundColor,
              color: resolvedTextColor,
            }}
          >
            <span className="text-sm font-medium text-center px-4 line-clamp-1">
              {buttonText}
            </span>
          </div>
        )
      })}

      {/* Hover overlay */}
      <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <Button
          variant="default"
          size="sm"
          onClick={handleButtonClick}
          className="pointer-events-auto"
        >
          {hoverText}
        </Button>
      </div>
    </div>
  )
}
