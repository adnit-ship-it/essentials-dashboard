"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getSectionPreviewImagePath } from "@/lib/utils/section-preview-images"

interface PreviewImageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionName: string
  templateName: string | null
}

export function PreviewImageModal({
  open,
  onOpenChange,
  sectionName,
  templateName,
}: PreviewImageModalProps) {
  const previewImagePath = getSectionPreviewImagePath(sectionName, templateName)

  if (!previewImagePath) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[60vw] max-h-[60vh] p-0 overflow-hidden"
        onClick={() => onOpenChange(false)}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{sectionName}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center p-6">
          <img
            src={previewImagePath}
            alt={`${sectionName} preview`}
            className="max-w-full max-h-[calc(60vh-120px)] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="px-6 pb-6 text-sm text-muted-foreground text-center">
          Click anywhere to close
        </div>
      </DialogContent>
    </Dialog>
  )
}
