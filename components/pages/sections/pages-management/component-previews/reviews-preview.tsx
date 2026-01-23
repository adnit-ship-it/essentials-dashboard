"use client"

import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatComponentNameForEdit } from "./shared/format-component-name"
import type { BasePreviewProps } from "./shared/preview-props"

export function ReviewsPreview({
  componentKey,
  value,
  onClick,
  repoOwner,
  repoName,
  repoBranch = "main",
}: BasePreviewProps) {
  // Extract reviews array
  const reviews = Array.isArray(value) ? value : []
  const firstReview = reviews.length > 0 ? reviews[0] : null
  const totalCount = reviews.length
  const remainingCount = totalCount > 1 ? totalCount - 1 : 0
  const componentName = formatComponentNameForEdit(componentKey)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  // Determine button text
  const buttonText = remainingCount > 0
    ? `Edit ${componentName} (${remainingCount} more review${remainingCount !== 1 ? "s" : ""})`
    : `Edit ${componentName}`

  // If no reviews, show fallback
  if (!firstReview || totalCount === 0) {
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="text-xl font-semibold text-foreground transition-all group-hover:blur-sm" onClick={onClick}>
          {totalCount === 0 ? "No reviews" : "0 Reviews"}
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

  const stars = firstReview?.stars || 5
  const reviewText = firstReview?.review || ""

  return (
    <div
      className="group relative w-full h-full flex flex-col cursor-pointer rounded-md overflow-hidden"
      onClick={onClick}
    >
      {/* Content wrapper with blur on hover */}
      <div className="w-full h-full flex flex-col transition-all group-hover:blur-sm">
        {/* Top strip: Stars */}
        <div className="flex-1 flex items-center justify-center bg-muted">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((starNum) => (
              <Star
                key={starNum}
                className={`h-5 w-5 ${
                  stars >= starNum ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom strip: Review text */}
        <div className="flex-1 flex items-center justify-center bg-background">
          {reviewText ? (
            <div className="text-sm font-medium text-foreground text-center px-4 line-clamp-2">
              {reviewText}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center px-4">
              No review text
            </div>
          )}
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
          {buttonText}
        </Button>
      </div>
    </div>
  )
}
