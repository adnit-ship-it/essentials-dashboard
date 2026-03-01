"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSectionPreviewImagePath } from "@/lib/utils/section-preview-images"
import { PreviewPlaceholder } from "../preview-placeholder"
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

  return (
    <Card 
      className={cn(
        "overflow-hidden h-full flex flex-col group",
        onExpandClick && "cursor-pointer hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] transition-all duration-200"
      )}
      onClick={onExpandClick}
    >
      {/* Preview Image Area */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {previewImagePath && !imageError ? (
          <img
            src={previewImagePath}
            alt={`${sectionName} preview`}
            className="w-full h-full object-cover transition-all group-hover:blur-sm"
            onError={() => {
              setImageError(true)
            }}
          />
        ) : (
          <PreviewPlaceholder variant="section" />
        )}
        
        {/* Hover overlay with button */}
        {onExpandClick && (
          <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Button
              variant="default"
              size="sm"
              onClick={handleButtonClick}
              className="pointer-events-auto"
            >
              View Full Preview
            </Button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">Section Preview</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            Click to view full section screenshot
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
