"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSectionPreviewImagePath } from "@/lib/utils/section-preview-images"
import { cn } from "@/lib/utils"

interface SectionPreviewEditorProps {
  sectionName: string
  templateName: string | null
  onExpandClick?: () => void
}

export function SectionPreviewEditor({ sectionName, templateName, onExpandClick }: SectionPreviewEditorProps) {
  const previewImagePath = getSectionPreviewImagePath(sectionName, templateName)
  const [imageError, setImageError] = useState(false)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onExpandClick) {
      onExpandClick()
    }
  }

  if (!previewImagePath || imageError) {
    return null
  }

  return (
    <Card 
      className={cn(
        "aspect-square flex flex-col h-full group",
        onExpandClick && "cursor-pointer transition-all hover:shadow-md"
      )}
      onClick={onExpandClick}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm">Section Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center p-4 relative">
        <div className="relative w-full h-full overflow-hidden rounded-md border bg-muted">
          <img
            src={previewImagePath}
            alt={`${sectionName} preview`}
            className="w-full h-full object-contain transition-all group-hover:blur-sm"
            onError={() => {
              setImageError(true)
            }}
          />
        </div>
        {onExpandClick && (
          <div className="absolute inset-0 hidden group-hover:flex items-center justify-center backdrop-blur-sm rounded-md">
            <Button
              variant="default"
              size="sm"
              onClick={handleButtonClick}
              className="pointer-events-auto"
            >
              Edit Section Preview
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

