"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { usePagesStore } from "@/lib/stores/pages-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface PageMetadataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PageMetadataModal({ open, onOpenChange }: PageMetadataModalProps) {
  const { commonData, updatePageMetadata } = usePagesStore()

  const pageTitle = commonData?.strings?.pageTitle || ""
  const pageDescription = commonData?.strings?.pageDescription || ""

  const handlePageTitleChange = (title: string) => {
    updatePageMetadata(title, pageDescription)
  }

  const handlePageDescriptionChange = (description: string) => {
    updatePageMetadata(pageTitle, description)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Page Metadata</DialogTitle>
          <DialogDescription>
            Global page title and description used across the site.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Page Title</Label>
            <Input
              value={pageTitle}
              onChange={(e) => handlePageTitleChange(e.target.value)}
              placeholder="Your Site Name"
            />
          </div>
          <div className="space-y-2">
            <Label>Page Description</Label>
            <Textarea
              value={pageDescription}
              onChange={(e) => handlePageDescriptionChange(e.target.value)}
              placeholder="A brief description of your site"
              rows={3}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
