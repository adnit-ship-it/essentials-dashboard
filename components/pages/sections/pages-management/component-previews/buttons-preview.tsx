"use client"

import { Button } from "@/components/ui/button"
import { useBrandColors, resolveBrandColor } from "@/lib/utils/brand-colors"
import { formatComponentNameForEdit } from "./shared/format-component-name"
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

  const componentName = formatComponentNameForEdit(componentKey)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  // Determine button text
  const buttonText = remainingCount > 0
    ? `Edit ${componentName} (${remainingCount} more button${remainingCount !== 1 ? "s" : ""})`
    : `Edit ${componentName}`

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

  // Handle empty array
  if (totalCount === 0) {
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="text-xl font-semibold text-foreground text-center transition-all group-hover:blur-sm" onClick={onClick}>
          No buttons
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
    <div
      className="group relative w-full h-full flex flex-col cursor-pointer rounded-md overflow-hidden"
      onClick={onClick}
    >
      {/* Content wrapper with blur on hover */}
      <div className="w-full h-full flex flex-col transition-all group-hover:blur-sm">
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
              className="flex-1 flex items-center justify-center"
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
      </div>

      {/* Hover overlay */}
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
