"use client"

import { useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, Loader2 } from "lucide-react"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { fileToPendingUpload } from "@/lib/utils/file-uploads"
import { uploadLogoFile, getFileSha } from "@/lib/services/logo-registry"

const FAVICON_PATH = "public/favicon.ico"

interface FaviconModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FaviconModal({ open, onOpenChange }: FaviconModalProps) {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFaviconUrl = () => {
    if (!repoOwnerFromLink || !repoNameFromLink) return ""
    return `https://raw.githubusercontent.com/${repoOwnerFromLink}/${repoNameFromLink}/main/${FAVICON_PATH}`
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validExtensions = ["ico", "png", "svg"]
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !validExtensions.includes(extension)) {
      setError("Favicon must be .ico, .png, or .svg file")
      return
    }

    const maxSize = 1024 * 1024
    if (file.size > maxSize) {
      setError("Favicon file size must be less than 1MB")
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
      const pending = await fileToPendingUpload(file)
      
      let existingSha: string | null = null
      try {
        existingSha = await getFileSha(repoOwnerFromLink, repoNameFromLink, FAVICON_PATH)
      } catch (shaError: any) {
        if (shaError.status !== 404 && shaError.response?.status !== 404) {
          throw new Error(`Failed to check if file exists: ${shaError.message}`)
        }
      }

      await uploadLogoFile(
        repoOwnerFromLink,
        repoNameFromLink,
        FAVICON_PATH,
        pending.base64,
        existingSha || undefined
      )

      setSuccess("Favicon updated successfully!")
      setTimeout(() => {
        setSuccess(null)
        onOpenChange(false)
      }, 2000)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || "Failed to upload favicon"
      setError(errorMessage)
      console.error("Favicon upload error:", err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Favicon</DialogTitle>
          <DialogDescription>
            Upload or replace the site favicon (public/favicon.ico)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".ico,.png,.svg"
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="favicon-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
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
                  Upload Favicon
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-500 bg-green-50 p-2 rounded">
              {success}
            </div>
          )}

          {getFaviconUrl() && (
            <div className="space-y-2">
              <Label>Current Favicon Preview</Label>
              <div className="w-16 h-16 border rounded bg-muted flex items-center justify-center overflow-hidden">
                <img
                  src={getFaviconUrl()}
                  alt="Favicon"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Path: {FAVICON_PATH}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
