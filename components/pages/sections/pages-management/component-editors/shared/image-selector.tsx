"use client"

import { useState, useRef } from "react"
import { Upload } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { convertContentRepoPathToRawUrl } from "@/lib/utils/repo-paths"
import { fileToPendingUpload } from "@/lib/utils/file-uploads"
import { uploadLogoFile, getFileSha } from "@/lib/services/logo-registry"
import { cn } from "@/lib/utils"

interface ImageSelectorProps {
  label: string
  value: string
  onChange: (path: string) => void
  directory?: string
  disabled?: boolean
}

function slugFromPath(path: string): string {
  const base = path.split("/").pop() || "image"
  const withoutExt = base.replace(/\.[^.]+$/, "")
  const slug = withoutExt.replace(/[^a-z0-9-]/gi, "-").toLowerCase()
  return `${slug}-${Date.now()}`
}

export function ImageSelector({
  label,
  value,
  onChange,
  directory = "public/assets/images/",
  disabled = false,
}: ImageSelectorProps) {
  const { mediaData, updateMediaData } = usePagesStore()
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const imageRegistry = mediaData?.imageRegistry || {}
  const registryEntries = Object.entries(imageRegistry)

  const getPreviewUrl = (path: string) =>
    convertContentRepoPathToRawUrl(path, repoOwnerFromLink, repoNameFromLink) || path

  const handleSelect = (val: string) => {
    if (val === "__upload__") {
      fileInputRef.current?.click()
      return
    }
    const entry = imageRegistry[val]
    if (entry) onChange(entry.path)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError("File size must be less than 10MB")
      return
    }
    if (!repoOwnerFromLink || !repoNameFromLink) {
      setError("Repository not configured")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const pending = await fileToPendingUpload(file)
      const ext = file.name.split(".").pop()?.toLowerCase() || "png"
      const fileName = `image-${Date.now()}.${ext}`
      const filePath = `${directory}${fileName}`

      let existingSha: string | null = null
      try {
        existingSha = await getFileSha(repoOwnerFromLink, repoNameFromLink, filePath)
      } catch {
        // 404 is fine
      }

      await uploadLogoFile(
        repoOwnerFromLink,
        repoNameFromLink,
        filePath,
        pending.base64,
        existingSha || undefined
      )

      const websitePath = filePath.startsWith("public/")
        ? `/${filePath.slice(7)}`
        : `/${filePath}`
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim() || "Image"
      const id = slugFromPath(websitePath)

      updateMediaData((data) => {
        const registry = data.imageRegistry || {}
        const existingIds = new Set(Object.keys(registry))
        let finalId = id
        let i = 1
        while (existingIds.has(finalId)) {
          finalId = `${id}-${i++}`
        }
        return {
          ...data,
          imageRegistry: {
            ...registry,
            [finalId]: { id: finalId, path: websitePath, alt },
          },
        }
      })

      onChange(websitePath)
    } catch (err: any) {
      setError(err?.message || "Failed to upload")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const selectedId = registryEntries.find(([, entry]) => entry.path === value)?.[0]
  const displayValue = selectedId ?? (value ? "__custom__" : "")

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Select
          value={displayValue}
          onValueChange={handleSelect}
          disabled={disabled || uploading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select or upload image" />
          </SelectTrigger>
          <SelectContent>
            {registryEntries.map(([id, entry]) => (
              <SelectItem key={id} value={id}>
                <div className="flex items-center gap-2">
                  <img
                    src={getPreviewUrl(entry.path)}
                    alt={entry.alt}
                    className="h-6 w-6 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                  <span>{entry.alt || id}</span>
                </div>
              </SelectItem>
            ))}
            {value && !selectedId && (
              <SelectItem value="__custom__" disabled>
                <span className="text-muted-foreground truncate max-w-[200px]">Current: {value}</span>
              </SelectItem>
            )}
            <SelectItem value="__upload__">
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload new image
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? "..." : <Upload className="h-4 w-4" />}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {value && (
        <div className="mt-2 h-24 w-full max-w-xs bg-muted rounded-md flex items-center justify-center overflow-hidden">
          <img
            src={getPreviewUrl(value)}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none"
            }}
          />
        </div>
      )}
    </div>
  )
}
