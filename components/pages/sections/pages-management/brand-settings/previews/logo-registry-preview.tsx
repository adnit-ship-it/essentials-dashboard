"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { convertContentRepoPathToRawUrl } from "@/lib/utils/repo-paths"
import { usePagesStore } from "@/lib/stores/pages-store"

interface LogoRegistryPreviewProps {
  onEdit: () => void
  repoOwner?: string | null
  repoName?: string | null
  repoBranch?: string
}

export function LogoRegistryPreview({ onEdit, repoOwner, repoName, repoBranch = "main" }: LogoRegistryPreviewProps) {
  const { pagesData } = usePagesStore()
  const [imageError, setImageError] = useState(false)

  if (!pagesData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground text-center">
          Loading...
        </div>
      </div>
    )
  }

  const logoRegistry = pagesData?.logoRegistry || {}
  
  // Find primary logo
  const primaryLogo = Object.entries(logoRegistry).find(
    ([_, entry]: [string, any]) => entry?.type === "primary"
  )?.[1] as any

  const logoPath = primaryLogo?.path || null
  const displayImageSrc = logoPath
    ? convertContentRepoPathToRawUrl(logoPath, repoOwner, repoName, repoBranch) || logoPath
    : null

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit()
  }

  const handleImageError = () => {
    setImageError(true)
  }

  if (!displayImageSrc || imageError || !primaryLogo) {
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="text-sm text-muted-foreground text-center px-4">
          {!primaryLogo ? "No primary logo" : "Logo not found"}
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
      <div className="w-full h-full overflow-hidden rounded-md">
        <img
          src={displayImageSrc}
          alt="Primary logo"
          className="w-full h-full object-contain transition-all group-hover:blur-sm"
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
