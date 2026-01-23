"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

const FAVICON_PATH = "public/favicon.ico"

interface FaviconPreviewProps {
  onEdit: () => void
  repoOwner?: string | null
  repoName?: string | null
  repoBranch?: string
}

export function FaviconPreview({ onEdit, repoOwner, repoName, repoBranch = "main" }: FaviconPreviewProps) {
  const [imageError, setImageError] = useState(false)

  const getFaviconUrl = () => {
    if (!repoOwner || !repoName) return null
    return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${repoBranch}/${FAVICON_PATH}`
  }

  const displayImageSrc = getFaviconUrl()

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit()
  }

  const handleImageError = () => {
    setImageError(true)
  }

  if (!displayImageSrc || imageError) {
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="text-sm text-muted-foreground text-center px-4">
          {!displayImageSrc ? "No favicon" : "Favicon not found"}
        </div>
        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center backdrop-blur-sm">
          <Button
            variant="default"
            size="sm"
            onClick={handleButtonClick}
            className="pointer-events-auto"
          >
            Edit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative w-full h-full cursor-pointer rounded-md overflow-hidden">
      <div className="w-full h-full overflow-hidden rounded-md flex items-center justify-center bg-muted">
        <img
          src={displayImageSrc}
          alt="Favicon"
          className="w-16 h-16 object-contain transition-all group-hover:blur-sm"
          onError={handleImageError}
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 hidden group-hover:flex items-center justify-center backdrop-blur-sm">
        <Button
          variant="default"
          size="sm"
          onClick={handleButtonClick}
          className="pointer-events-auto"
        >
          Edit
        </Button>
      </div>
    </div>
  )
}
