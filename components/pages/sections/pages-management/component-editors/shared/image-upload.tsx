"use client"

import { useState, useRef } from "react"
import { Upload, Loader2, Image as ImageIcon, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { fileToPendingUpload } from "@/lib/utils/file-uploads"
import { uploadLogoFile, getFileSha } from "@/lib/services/logo-registry"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  label: string
  value: string // Current image path
  onChange: (newPath: string) => void
  directory?: string // Directory to upload to (default: public/assets/images/)
  disabled?: boolean
}

export function ImageUpload({
  label,
  value,
  onChange,
  directory = "public/assets/images/",
  disabled = false,
}: ImageUploadProps) {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [imageTimestamp, setImageTimestamp] = useState(Date.now())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Convert relative path to GitHub raw URL for preview with cache-busting
  const getImagePreviewUrl = (path: string): string => {
    if (!path) return ""
    
    // If already a full URL, add cache-busting parameter
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const separator = path.includes("?") ? "&" : "?"
      return `${path}${separator}t=${imageTimestamp}`
    }
    
    // If we have repo info, convert to GitHub raw URL with cache-busting
    if (repoOwnerFromLink && repoNameFromLink) {
      const cleanPath = path.startsWith("/") ? path.slice(1) : path
      const repoPath = cleanPath.startsWith("public/") ? cleanPath : `public/${cleanPath}`
      return `https://raw.githubusercontent.com/${repoOwnerFromLink}/${repoNameFromLink}/main/${repoPath}?t=${imageTimestamp}`
    }
    
    // Fallback: return as-is (might work if served from public folder)
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
    setSuccess(null)

    try {
      // Convert to base64
      const pending = await fileToPendingUpload(file)
      
      // Determine file path
      // If value exists, check if extension needs to change
      // Otherwise, generate new filename
      let filePath: string
      const newExtension = file.name.split('.').pop()?.toLowerCase() || 'png'
      
      if (value) {
        // Extract path from value (remove leading / if present)
        const cleanPath = value.startsWith("/") ? value.slice(1) : value
        let basePath = cleanPath.startsWith("public/") ? cleanPath : `public/${cleanPath}`
        
        // Check if extension needs to change
        const oldExtension = basePath.split('.').pop()?.toLowerCase()
        if (oldExtension && oldExtension !== newExtension) {
          // Replace extension
          const pathWithoutExt = basePath.substring(0, basePath.lastIndexOf('.'))
          filePath = `${pathWithoutExt}.${newExtension}`
        } else {
          filePath = basePath
        }
      } else {
        // Generate new filename
        const timestamp = Date.now()
        const fileName = `image-${timestamp}.${newExtension}`
        filePath = `${directory}${fileName}`
      }

      // Get SHA if file exists
      let existingSha: string | null = null
      try {
        existingSha = await getFileSha(repoOwnerFromLink, repoNameFromLink, filePath)
      } catch (shaError: any) {
        // If 404, file doesn't exist - that's fine
        if (shaError.status !== 404 && shaError.response?.status !== 404) {
          throw new Error(`Failed to check if file exists: ${shaError.message}`)
        }
      }
      
      // Upload file
      await uploadLogoFile(
        repoOwnerFromLink,
        repoNameFromLink,
        filePath,
        pending.base64,
        existingSha || undefined
      )

      // Update with new path (website path format)
      const websitePath = filePath.startsWith("public/")
        ? `/${filePath.slice(7)}` // Remove "public" prefix
        : `/${filePath}`
      
      onChange(websitePath)
      setImageTimestamp(Date.now()) // Update timestamp to force preview refresh
      setSuccess("Image uploaded successfully!")
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || "Failed to upload image"
      setError(errorMessage)
      console.error("Image upload error:", err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
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
          id={`image-upload-${label}`}
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
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/assets/images/..."
          disabled={uploading || disabled}
          className="flex-1"
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded">
          <span className="flex-1">{error}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          <span>{success}</span>
        </div>
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

