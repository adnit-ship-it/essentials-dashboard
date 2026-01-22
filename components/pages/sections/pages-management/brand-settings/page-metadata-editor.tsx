"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { usePagesStore } from "@/lib/stores/pages-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function PageMetadataEditor() {
  const { pagesData, updatePagesData } = usePagesStore()
  const [isOpen, setIsOpen] = useState(false)

  if (!pagesData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on input fields or buttons
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea")
    ) {
      return
    }
    setIsOpen(!isOpen)
  }

  return (
    <Card 
      className="cursor-pointer hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] transition-all duration-200"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Page Metadata</CardTitle>
            <CardDescription>Global page title and description used across the site.</CardDescription>
          </div>
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
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
        </CardContent>
      )}
    </Card>
  )
}

