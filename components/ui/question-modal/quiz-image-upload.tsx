"use client"

import { useState, useRef } from "react"
import { Upload, Loader2, Image as ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { fileToPendingUpload } from "@/lib/utils/file-uploads"
import { cn } from "@/lib/utils"

interface QuizImageUploadProps {
  label: string
  value: string // Current image path (absolute format: /assets/images/quizzes/...)
  onChange: (newPath: string) => void
  disabled?: boolean
  onDelete?: () => void // Callback when image is removed
}

export function QuizImageUpload({
  label,
  value,
  onChange,
  disabled = false,
  onDelete,
}: QuizImageUploadProps) {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const directory = "public/assets/images/quizzes/"

  // Convert absolute path to GitHub raw URL for preview
  const getImagePreviewUrl = (path: string): string => {
    if (!path) return ""
    
    // If already a full URL, return as-is
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path
    }
    
    // Convert absolute path (/assets/images/quizzes/file.jpg) to repo path
    if (repoOwnerFromLink && repoNameFromLink) {
      const cleanPath = path.startsWith("/") ? path.slice(1) : path
      const repoPath = `public/${cleanPath}`
      return `https://raw.githubusercontent.com/${repoOwnerFromLink}/${repoNameFromLink}/main/${repoPath}`
    }
    
    // Fallback: return as-is
    return path
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError("File size must be less than 10MB")
      return
    }

    if (!repoOwnerFromLink || !repoNameFromLink) {
      setError("Repository not configured. Please configure organization settings.")
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Convert to base64
      const pending = await fileToPendingUpload(file)
      
      // Determine file path
      const newExtension = file.name.split('.').pop()?.toLowerCase() || 'png'
      let filePath: string
      let oldFilePath: string | null = null
      
      if (value) {
        // Extract old file path for deletion
        const cleanPath = value.startsWith("/") ? value.slice(1) : value
        oldFilePath = `public/${cleanPath}`
        
        // Use same filename but update extension if needed
        const oldFileName = cleanPath.split('/').pop() || ''
        const oldExtension = oldFileName.split('.').pop()?.toLowerCase()
        
        if (oldExtension && oldExtension !== newExtension) {
          // Replace extension
          const fileNameWithoutExt = oldFileName.substring(0, oldFileName.lastIndexOf('.'))
          const newFileName = `${fileNameWithoutExt}.${newExtension}`
          filePath = `${directory}${newFileName}`
        } else {
          // Keep same filename
          filePath = `${directory}${oldFileName}`
        }
      } else {
        // Generate new filename
        const timestamp = Date.now()
        const fileName = `quiz-image-${timestamp}.${newExtension}`
        filePath = `${directory}${fileName}`
      }

      // Prepare request body
      const requestBody: any = {
        filePath,
        contentBase64: pending.base64,
      }

      // If replacing an existing file, include deletion info
      if (oldFilePath && oldFilePath !== filePath) {
        // Try to get SHA for old file deletion
        try {
          const shaResponse = await fetch(
            `/api/file-metadata?path=${encodeURIComponent(oldFilePath)}&owner=${encodeURIComponent(repoOwnerFromLink!)}&repo=${encodeURIComponent(repoNameFromLink!)}`
          )
          if (shaResponse.ok) {
            const shaData = await shaResponse.json()
            if (shaData.sha) {
              requestBody.deletePath = oldFilePath
              requestBody.deleteSha = shaData.sha
            }
          }
        } catch (err) {
          // If we can't get SHA, continue without deletion
          console.warn("Could not get SHA for old file, skipping deletion:", err)
        }
      }

      // Upload file via API
      const url = `/api/quiz-images?owner=${encodeURIComponent(repoOwnerFromLink!)}&repo=${encodeURIComponent(repoNameFromLink!)}`
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to upload image: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Update with absolute path format
      onChange(result.fileUrl)
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to upload image"
      setError(errorMessage)
      console.error("Image upload error:", err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = async () => {
    if (!value) return

    if (!repoOwnerFromLink || !repoNameFromLink) {
      setError("Repository not configured")
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Convert absolute path to repo path
      const cleanPath = value.startsWith("/") ? value.slice(1) : value
      const repoPath = `public/${cleanPath}`

      // Get SHA for deletion
      try {
        const shaResponse = await fetch(
          `/api/file-metadata?path=${encodeURIComponent(repoPath)}&owner=${encodeURIComponent(repoOwnerFromLink!)}&repo=${encodeURIComponent(repoNameFromLink!)}`
        )
        if (shaResponse.ok) {
          const shaData = await shaResponse.json()
          if (shaData.sha) {
            // Delete file via API
            const deleteUrl = `/api/quiz-images?owner=${encodeURIComponent(repoOwnerFromLink!)}&repo=${encodeURIComponent(repoNameFromLink!)}`
            const response = await fetch(deleteUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                deletePath: repoPath,
                deleteSha: shaData.sha,
              }),
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.error || "Failed to delete image")
            }
          }
        }
      } catch (err: any) {
        // If file doesn't exist or we can't get SHA, that's okay
        console.warn("Could not delete image:", err)
      }

      onChange("")
      onDelete?.()
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to delete image"
      setError(errorMessage)
      console.error("Image deletion error:", err)
    } finally {
      setUploading(false)
    }
  }


  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileSelect}
          disabled={uploading || disabled}
          className="hidden"
          id={`quiz-image-upload-${label.replace(/\s+/g, "-")}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload
            </>
          )}
        </Button>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={uploading || disabled}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Remove
          </Button>
        )}
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/assets/images/quizzes/..."
          disabled={uploading || disabled}
          className="flex-1"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {value && (
        <div className="mt-2 h-32 w-full max-w-xs bg-muted rounded-md flex items-center justify-center overflow-hidden">
          <img
            src={getImagePreviewUrl(value)}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
            }}
          />
        </div>
      )}
    </div>
  )
}
