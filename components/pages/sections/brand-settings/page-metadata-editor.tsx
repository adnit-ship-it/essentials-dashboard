"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface PageMetadataEditorProps {
  pageTitle: string
  pageDescription: string
  onPageTitleChange: (title: string) => void
  onPageDescriptionChange: (description: string) => void
}

export function PageMetadataEditor({
  pageTitle,
  pageDescription,
  onPageTitleChange,
  onPageDescriptionChange,
}: PageMetadataEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Metadata</CardTitle>
        <CardDescription>
          Configure the page title and description shown in browser tabs and search results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="page-title">Page Title</Label>
            <Input
              id="page-title"
              value={pageTitle}
              onChange={(e) => onPageTitleChange(e.target.value)}
              placeholder="Enter page title"
              className="max-w-md"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="page-description">Page Description</Label>
            <Textarea
              id="page-description"
              value={pageDescription}
              onChange={(e) => onPageDescriptionChange(e.target.value)}
              placeholder="Enter page description"
              rows={3}
              className="max-w-2xl"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}




