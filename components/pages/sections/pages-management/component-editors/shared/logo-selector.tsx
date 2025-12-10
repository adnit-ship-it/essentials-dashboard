"use client"

import { useState, useEffect } from "react"
import { ImageIcon, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { usePagesStore } from "@/lib/stores/pages-store"
import type { LogoRegistry } from "@/lib/types/pages"

interface LogoSelectorProps {
  label: string
  value: string
  onChange: (logoPath: string) => void
}

export function LogoSelector({ label, value, onChange }: LogoSelectorProps) {
  const { pagesData } = usePagesStore()
  const [logoPreviews, setLogoPreviews] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const logoRegistry = pagesData?.logoRegistry || {}

  // Fetch logo images on first render
  useEffect(() => {
    const fetchLogos = async () => {
      const entries = Object.entries(logoRegistry)
      if (entries.length === 0) return

      setLoading(true)
      const previews: Record<string, string> = {}

      // Load images
      for (const [key, entry] of entries) {
        try {
          // Use the path directly as src
          previews[key] = entry.path
        } catch (err) {
          console.error(`Failed to load logo ${key}:`, err)
        }
      }

      setLogoPreviews(previews)
      setLoading(false)
    }

    fetchLogos()
  }, [logoRegistry])

  const selectedKey = Object.entries(logoRegistry).find(
    ([_, entry]) => entry.path === value
  )?.[0]

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={selectedKey || ""}
        onValueChange={(key) => {
          const entry = logoRegistry[key]
          if (entry) {
            onChange(entry.path)
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a logo" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(logoRegistry).map(([key, entry]) => (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                {logoPreviews[key] ? (
                  <img
                    src={logoPreviews[key]}
                    alt={entry.description}
                    className="h-6 w-6 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                    }}
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
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
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading logos...
        </div>
      )}
    </div>
  )
}

