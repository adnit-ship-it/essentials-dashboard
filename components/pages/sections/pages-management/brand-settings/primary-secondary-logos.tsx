"use client"

import { useState, useRef } from "react"
import { Upload, Loader2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { usePagesStore } from "@/lib/stores/pages-store"
import { LogoSelector } from "../component-editors/shared/logo-selector"
import { fileToPendingUpload } from "@/lib/utils/file-uploads"
import { uploadLogoFile, getFileSha } from "@/lib/services/logo-registry"

const LOGO_LABELS = {
  primary: "Primary Logo",
  secondary: "Secondary Logo",
}

const LOGO_DESCRIPTIONS = {
  primary: "Displayed across the application as the main logo.",
  secondary: "Used in contexts that require an alternate mark.",
}

export function PrimarySecondaryLogos() {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const { pagesData, updatePagesData } = usePagesStore()
  const [updating, setUpdating] = useState<"primary" | "secondary" | null>(null)
  const [uploading, setUploading] = useState<"primary" | "secondary" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const primaryFileInputRef = useRef<HTMLInputElement>(null)
  const secondaryFileInputRef = useRef<HTMLInputElement>(null)

  if (!pagesData?.logoRegistry) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Logo registry not available.</p>
        </CardContent>
      </Card>
    )
  }

  const logoRegistry = pagesData.logoRegistry
  const primaryLogo = Object.entries(logoRegistry).find(([_, entry]) => entry.type === "primary")?.[1]
  const secondaryLogo = Object.entries(logoRegistry).find(([_, entry]) => entry.type === "secondary")?.[1]

  const handleLogoUpdate = async (slot: "primary" | "secondary", newPath: string) => {
    if (!repoOwnerFromLink || !repoNameFromLink) return

    setUpdating(slot)

    try {
      // Find existing logo entry or create new
      const existingKey = Object.entries(logoRegistry).find(
        ([_, entry]) => entry.type === slot
      )?.[0]

      if (existingKey) {
        // Update existing entry
        updatePagesData((data) => {
          const updated = { ...data }
          if (updated.logoRegistry) {
            updated.logoRegistry = {
              ...updated.logoRegistry,
              [existingKey]: {
                ...updated.logoRegistry[existingKey],
                path: newPath,
              },
            }
          }
          return updated
        })
      } else {
        // Create new entry
        const newKey = slot === "primary" ? "logo1" : "logo2"
        updatePagesData((data) => {
          const updated = { ...data }
          if (!updated.logoRegistry) {
            updated.logoRegistry = {}
          }
          updated.logoRegistry = {
            ...updated.logoRegistry,
            [newKey]: {
              type: slot,
              path: newPath,
              description: LOGO_LABELS[slot],
            },
          }
          return updated
        })
      }
    } catch (err) {
      console.error("Failed to update logo:", err)
    } finally {
      setUpdating(null)
    }
  }

  const handleFileUpload = async (slot: "primary" | "secondary", file: File) => {
    if (!repoOwnerFromLink || !repoNameFromLink) {
      setError("Repository not configured")
      return
    }

    setUploading(slot)
    setError(null)

    try {
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

      // Find existing logo entry
      const existingKey = Object.entries(logoRegistry).find(
        ([_, entry]) => entry.type === slot
      )?.[0]

      if (!existingKey) {
        setError(`${LOGO_LABELS[slot]} not found in registry. Please select a logo first.`)
        return
      }

      const existingEntry = logoRegistry[existingKey]
      if (!existingEntry?.path) {
        setError(`${LOGO_LABELS[slot]} path not found.`)
        return
      }

      // Convert path to repo path format
      const websitePath = existingEntry.path
      const cleanPath = websitePath.startsWith("/") ? websitePath.slice(1) : websitePath
      const repoPath = cleanPath.startsWith("public/") ? cleanPath : `public/${cleanPath}`

      // Get existing file SHA
      let existingSha: string | null = null
      try {
        existingSha = await getFileSha(repoOwnerFromLink, repoNameFromLink, repoPath)
      } catch (shaError: any) {
        // If 404, file doesn't exist - that's fine, we'll create it
        if (shaError.status !== 404 && shaError.response?.status !== 404) {
          throw new Error(`Failed to check if file exists: ${shaError.message}`)
        }
      }

      // Convert file to base64
      const pending = await fileToPendingUpload(file)

      // Upload/replace the file at the same path
      await uploadLogoFile(
        repoOwnerFromLink,
        repoNameFromLink,
        repoPath,
        pending.base64,
        existingSha || undefined
      )

      // File is updated in place - all references will automatically use the updated file
      // No need to update references since we're using the same path
      
      // Clear file input
      if (slot === "primary" && primaryFileInputRef.current) {
        primaryFileInputRef.current.value = ""
      }
      if (slot === "secondary" && secondaryFileInputRef.current) {
        secondaryFileInputRef.current.value = ""
      }

      setError(null)
    } catch (err) {
      setError((err as Error).message || `Failed to upload ${LOGO_LABELS[slot].toLowerCase()}`)
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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

      <Card>
        <CardHeader>
          <CardTitle>Primary Logo</CardTitle>
          <CardDescription>{LOGO_DESCRIPTIONS.primary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LogoSelector
            label="Select from Registry"
            value={primaryLogo?.path || ""}
            onChange={(path) => handleLogoUpdate("primary", path)}
          />
          {primaryLogo?.path && (
            <div className="space-y-2">
              <Label>Update Logo File</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  ref={primaryFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileUpload("primary", file)
                    }
                  }}
                  disabled={uploading === "primary"}
                  className="hidden"
                  id="primary-logo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => primaryFileInputRef.current?.click()}
                  disabled={uploading === "primary" || !primaryLogo?.path}
                  className="gap-2"
                >
                  {uploading === "primary" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload New File
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a new file to replace the existing logo. All references will automatically use the updated file.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Secondary Logo</CardTitle>
          <CardDescription>{LOGO_DESCRIPTIONS.secondary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LogoSelector
            label="Select from Registry"
            value={secondaryLogo?.path || ""}
            onChange={(path) => handleLogoUpdate("secondary", path)}
          />
          {secondaryLogo?.path && (
            <div className="space-y-2">
              <Label>Update Logo File</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  ref={secondaryFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileUpload("secondary", file)
                    }
                  }}
                  disabled={uploading === "secondary"}
                  className="hidden"
                  id="secondary-logo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => secondaryFileInputRef.current?.click()}
                  disabled={uploading === "secondary" || !secondaryLogo?.path}
                  className="gap-2"
                >
                  {uploading === "secondary" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload New File
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a new file to replace the existing logo. All references will automatically use the updated file.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}




