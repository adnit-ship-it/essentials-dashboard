"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Expand } from "lucide-react"
import { getSectionPreviewImagePath } from "@/lib/utils/section-preview-images"

interface SectionPreviewEditorProps {
  sectionName: string
  templateName: string | null
  onExpandClick?: () => void
}

export function SectionPreviewEditor({ sectionName, templateName, onExpandClick }: SectionPreviewEditorProps) {
  const previewImagePath = getSectionPreviewImagePath(sectionName, templateName)
  const [imageError, setImageError] = useState(false)

  if (!previewImagePath || imageError) {
    return null
  }

  return (
    <Card className="aspect-square flex flex-col h-full">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Section Preview</CardTitle>
          {onExpandClick && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onExpandClick}
              title="Expand"
            >
              <Expand className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full h-full overflow-hidden rounded-md border bg-muted ">
          <img
            src={previewImagePath}
            alt={`${sectionName} preview`}
            className="w-full h-full object-contain "
            onError={() => {
              setImageError(true)
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

