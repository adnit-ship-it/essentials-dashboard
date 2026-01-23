"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { usePagesStore } from "@/lib/stores/pages-store"

interface PageMetadataPreviewProps {
  onEdit: () => void
  repoOwner?: string | null
  repoName?: string | null
}

export function PageMetadataPreview({ onEdit, repoOwner, repoName }: PageMetadataPreviewProps) {
  const { pagesData } = usePagesStore()

  if (!pagesData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground text-center">
          Loading...
        </div>
      </div>
    )
  }

  const common = (pagesData as any).common || {}
  const pageTitle = common.pageTitle || ""
  const pageDescription = common.pageDescription || ""

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit()
  }

  return (
    <div className="group relative w-full h-full flex flex-col cursor-pointer rounded-md overflow-hidden">
      {/* Content wrapper with blur on hover */}
      <div className="w-full h-full flex flex-col transition-all group-hover:blur-sm">
        {/* Top strip: Page Title */}
        <div className="flex-1 flex items-center justify-center bg-muted">
          {pageTitle ? (
            <div className="text-lg font-semibold text-foreground text-center px-4 line-clamp-2">
              {pageTitle}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center px-4">
              No title
            </div>
          )}
        </div>

        {/* Bottom strip: Page Description */}
        <div className="flex-1 flex items-center justify-center bg-background">
          {pageDescription ? (
            <div className="text-sm font-medium text-foreground text-center px-4 line-clamp-2">
              {pageDescription}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center px-4">
              No description
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
          Edit
        </Button>
      </div>
    </div>
  )
}
