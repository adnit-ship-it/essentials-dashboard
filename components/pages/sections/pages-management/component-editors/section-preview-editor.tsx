"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSectionPreviewImagePath } from "@/lib/utils/section-preview-images"

interface SectionPreviewEditorProps {
  sectionName: string
  templateName: string | null
}

export function SectionPreviewEditor({ sectionName, templateName }: SectionPreviewEditorProps) {
  const previewImagePath = getSectionPreviewImagePath(sectionName, templateName)
  const [imageError, setImageError] = useState(false)

  if (!previewImagePath || imageError) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Section Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-md border bg-muted aspect-video max-w-full">
          <img
            src={previewImagePath}
            alt={`${sectionName} preview`}
            className="w-full h-full object-cover"
            onError={() => {
              setImageError(true)
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

