"use client"

import { Button } from "@/components/ui/button"
import { normalizeTemplateName } from "@/lib/utils/component-value-formatter"
import type { BasePreviewProps } from "./shared/preview-props"

export function StatsPreview({
  componentKey,
  value,
  onClick,
  templateName,
  repoOwner,
  repoName,
  repoBranch = "main",
}: BasePreviewProps) {
  const templateType = normalizeTemplateName(templateName ?? null)

  // Extract cards array (for medivora: stats.cards[])
  let cards: any[] = []
  if (templateType === "medivora" && Array.isArray(value?.cards)) {
    cards = value.cards
  } else if (Array.isArray(value)) {
    // Direct array (fallback)
    cards = value
  }

  const firstCard = cards.length > 0 ? cards[0] : null
  const totalCount = cards.length
  const remainingCount = totalCount > 1 ? totalCount - 1 : 0

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  // If no cards, show fallback
  if (!firstCard || totalCount === 0) {
    return (
      <div className="text-xl font-semibold text-foreground">
        {totalCount === 0 ? "No statistics" : "0 Statistics"}
      </div>
    )
  }

  const cardValue = firstCard?.value || ""
  const cardDescription = firstCard?.description || ""

  return (
    <div
      className="group relative w-full h-full flex flex-col cursor-pointer rounded-md overflow-hidden"
      onClick={onClick}
    >
      {/* Content wrapper with blur on hover */}
      <div className="w-full h-full flex flex-col transition-all group-hover:blur-sm">
        {/* Top strip: Value */}
        <div className="flex-1 flex items-center justify-center bg-muted">
          {cardValue ? (
            <div className="text-xl font-semibold text-foreground text-center px-4 line-clamp-1">
              {cardValue}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center px-4">
              No value
            </div>
          )}
        </div>

        {/* Bottom strip: Description */}
        <div className="flex-1 flex items-center justify-center bg-background">
          {cardDescription ? (
            <div className="text-sm font-medium text-foreground text-center px-4 line-clamp-2">
              {cardDescription}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center px-4">
              No description
            </div>
          )}
        </div>
      </div>

      {/* Hover overlay */}
      {remainingCount > 0 && (
        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Button
            variant="default"
            size="sm"
            onClick={handleButtonClick}
            className="pointer-events-auto"
          >
            {remainingCount} more statistic{remainingCount !== 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  )
}
