"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, Loader2, ImageIcon } from "lucide-react"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { fileToPendingUpload } from "@/lib/utils/file-uploads"
import { uploadLogoFile, getFileSha } from "@/lib/services/logo-registry"

const FAVICON_PATH = "public/favicon.ico"

export function FaviconManager() {
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

    // Validate file type (favicon should be .ico, but also accept .png)
    const validExtensions = ["ico", "png", "svg"]
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !validExtensions.includes(extension)) {
      setError("Favicon must be .ico, .png, or .svg file")
      return
    }

    // Validate file size (max 1MB for favicon)
    const maxSize = 1024 * 1024 // 1MB
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
      // Convert to base64
      const pending = await fileToPendingUpload(file)
      
      // Get SHA if file exists
      let existingSha: string | null = null
      try {
        existingSha = await getFileSha(repoOwnerFromLink, repoNameFromLink, FAVICON_PATH)
      } catch (shaError: any) {
        if (shaError.status !== 404 && shaError.response?.status !== 404) {
          throw new Error(`Failed to check if file exists: ${shaError.message}`)
        }
      }

      // Upload file
      await uploadLogoFile(
        repoOwnerFromLink,
        repoNameFromLink,
        FAVICON_PATH,
        pending.base64,
        existingSha || undefined
      )

      setSuccess("Favicon updated successfully!")
      setTimeout(() => setSuccess(null), 5000)
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
    <Card>
      <CardHeader>
        <CardTitle>Favicon</CardTitle>
        <CardDescription>
          Upload or replace the site favicon (public/favicon.ico)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  )
}

