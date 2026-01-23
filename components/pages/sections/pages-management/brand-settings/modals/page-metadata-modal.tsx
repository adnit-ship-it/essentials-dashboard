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
  const { pagesData, updatePagesData } = usePagesStore()

  if (!pagesData) {
    return null
  }

  const common = (pagesData as any).common || {}
  const pageTitle = common.pageTitle || ""
  const pageDescription = common.pageDescription || ""

  const handlePageTitleChange = (title: string) => {
    updatePagesData(((data: any) => {
      return {
        ...data,
        common: {
          ...common,
          pageTitle: title,
        },
      }
    }) as any)
  }

  const handlePageDescriptionChange = (description: string) => {
    updatePagesData(((data: any) => {
      return {
        ...data,
        common: {
          ...common,
          pageDescription: description,
        },
      }
    }) as any)
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
