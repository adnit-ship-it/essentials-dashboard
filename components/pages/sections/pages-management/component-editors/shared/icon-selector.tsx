"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { usePagesStore } from "@/lib/stores/pages-store"
import type { IconRegistry } from "@/lib/types/pages"

interface IconSelectorProps {
  label: string
  value: string
  onChange: (iconPath: string) => void
}

export function IconSelector({ label, value, onChange }: IconSelectorProps) {
  const { pagesData } = usePagesStore()
  const [iconPreviews, setIconPreviews] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  const iconRegistry = pagesData?.iconRegistry || {}

  // Fetch SVGs on first dropdown open
  const fetchIcons = async () => {
    if (hasFetched || Object.keys(iconRegistry).length === 0) return

    setLoading(true)
    const previews: Record<string, string> = {}

    // Load SVG images
    for (const [key, entry] of Object.entries(iconRegistry)) {
      try {
        // Use the path directly as src
        previews[key] = entry.path
      } catch (err) {
        console.error(`Failed to load icon ${key}:`, err)
      }
    }

    setIconPreviews(previews)
    setLoading(false)
    setHasFetched(true)
  }

  const handleOpenChange = (open: boolean) => {
    if (open && !hasFetched) {
      fetchIcons()
    }
  }

  const selectedKey = Object.entries(iconRegistry).find(
    ([_, entry]) => entry.path === value
  )?.[0]

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={selectedKey || ""}
        onValueChange={(key) => {
          const entry = iconRegistry[key]
          if (entry) {
            onChange(entry.path)
          }
        }}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select an icon" />
        </SelectTrigger>
        <SelectContent>
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading icons...
            </div>
          )}
          {Object.entries(iconRegistry).map(([key, entry]) => (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                {iconPreviews[key] ? (
                  <img
                    src={iconPreviews[key]}
                    alt={entry.description}
                    className="h-5 w-5 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                    }}
                  />
                ) : (
                  <div className="h-5 w-5 bg-muted rounded" />
                )}
                <div className="flex flex-col">
                  <span>{key}</span>
                  <span className="text-xs text-muted-foreground">
                    {entry.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

