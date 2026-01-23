"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { convertContentRepoPathToRawUrl } from "@/lib/utils/repo-paths"

interface ImagePreviewWithHoverProps {
  imageSrc: string | null
  alt: string
  onClick: () => void
  hoverText?: string
  fallbackText?: string
  repoOwner?: string | null
  repoName?: string | null
  repoBranch?: string
}

export function ImagePreviewWithHover({
  imageSrc,
  alt,
  onClick,
  hoverText,
  fallbackText,
  repoOwner,
  repoName,
  repoBranch = "main",
}: ImagePreviewWithHoverProps) {
  const [imageError, setImageError] = useState(false)

  console.log("imageSrc for image preview with hover: ", imageSrc)

  // Convert content repo path to GitHub raw URL if needed
  const displayImageSrc = convertContentRepoPathToRawUrl(
    imageSrc,
    repoOwner,
    repoName,
    repoBranch
  ) || imageSrc

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  if (!displayImageSrc) {
    console.log("fallbackText for image preview with hover: ", imageError)
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="text-xl font-semibold text-foreground transition-all group-hover:blur-sm" onClick={onClick}>
          {fallbackText || "No Image"}
        </div>
        {hoverText && (
          <div className="absolute inset-0 hidden group-hover:flex items-center justify-center backdrop-blur-sm">
            <Button
              variant="default"
              size="sm"
              onClick={handleButtonClick}
              className="pointer-events-auto"
            >
              {hoverText}
            </Button>
          </div>
        )}
      </div>
    )
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className="group relative w-full h-full cursor-pointer rounded-md overflow-hidden">
      <div className="w-full h-full overflow-hidden rounded-md" onClick={onClick}>
        <img
          src={displayImageSrc}
          alt={alt}
          className="w-full h-full object-cover transition-all group-hover:blur-sm"
          onError={handleImageError}
          loading="lazy"
        />
      </div>
      {hoverText && (
        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center backdrop-blur-sm">
          <Button
            variant="default"
            size="sm"
            onClick={handleButtonClick}
            className="pointer-events-auto"
          >
            {hoverText}
          </Button>
        </div>
      )}
    </div>
  )
}
