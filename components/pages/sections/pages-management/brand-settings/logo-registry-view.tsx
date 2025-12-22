"use client"

import { useState, useRef, useEffect } from "react"
import React from "react"
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { fileToPendingUpload } from "@/lib/utils/file-uploads"
import { uploadLogoFile, getFileSha } from "@/lib/services/logo-registry"
import { generateNextLogoKey, generateLogoFileName, isLogoInUse } from "@/lib/utils/logo-registry"
import type { LogoRegistryEntry } from "@/lib/types/pages"
import { cn } from "@/lib/utils"

// Convert relative path to GitHub raw URL for preview
function getLogoPreviewUrl(path: string, repoOwner?: string, repoName?: string): string {
  if (!path) return ""
  
  // If already a full URL, return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  
  // If we have repo info, convert to GitHub raw URL
  if (repoOwner && repoName) {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path
    const repoPath = cleanPath.startsWith("public/") ? cleanPath : `public/${cleanPath}`
    return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${repoPath}`
  }
  
  // Fallback: return as-is (might work if served from public folder)
  return path
}

export function LogoRegistryView() {
  const { pagesData, sectionsData, updatePagesData } = usePagesStore()
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const logoRegistry = pagesData?.logoRegistry || {}

  const handleAddLogo = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setError("Please select a file")
      return
    }

    if (!repoOwnerFromLink || !repoNameFromLink) {
      setError("Repository not configured")
      return
    }

    const file = fileInputRef.current.files[0]
    setUploading(true)
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

      // Convert to base64
      const pending = await fileToPendingUpload(file)
      
      // Generate key and filename
      const newKey = generateNextLogoKey(logoRegistry)
      const fileName = generateLogoFileName(file)
      const filePath = `public/assets/images/brand/${fileName}`
      const websitePath = `/assets/images/brand/${fileName}`

      // Upload file (check if exists first)
      let existingSha: string | null = null
      try {
        existingSha = await getFileSha(repoOwnerFromLink, repoNameFromLink, filePath)
      } catch (shaError: any) {
        // If 404, file doesn't exist - that's fine
        if (shaError.status !== 404 && shaError.response?.status !== 404) {
          throw new Error(`Failed to check if file exists: ${shaError.message}`)
        }
      }

      await uploadLogoFile(
        repoOwnerFromLink,
        repoNameFromLink,
        filePath,
        pending.base64,
        existingSha || undefined
      )

      // Add to registry
      const newEntry: LogoRegistryEntry = {
        type: "custom",
        path: websitePath,
        description: `Custom logo ${newKey}`,
      }

      updatePagesData((data) => {
        const updated = { ...data }
        if (!updated.logoRegistry) {
          updated.logoRegistry = {}
        }
        updated.logoRegistry = {
          ...updated.logoRegistry,
          [newKey]: newEntry,
        }
        return updated
      })

      setIsAddDialogOpen(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      setError((err as Error).message || "Failed to add logo")
    } finally {
      setUploading(false)
    }
  }

  const handleEditLogo = async (key: string, newDescription: string, newFile?: File) => {
    if (!repoOwnerFromLink || !repoNameFromLink) {
      setError("Repository not configured")
      return
    }

    const entry = logoRegistry[key]
    if (!entry) return

    setUploading(true)
    setError(null)

    try {
      let newPath = entry.path
      
      // If new file provided, upload it
      if (newFile) {
        // Validate file type
        if (!newFile.type.startsWith("image/")) {
          setError("Please select an image file")
          return
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (newFile.size > maxSize) {
          setError("File size must be less than 10MB")
          return
        }

        const pending = await fileToPendingUpload(newFile)
        const filePath = `public/assets/images/brand/${entry.path.split('/').pop()}`
        
        let existingSha: string | null = null
        try {
          existingSha = await getFileSha(repoOwnerFromLink, repoNameFromLink, filePath)
        } catch (shaError: any) {
          // If 404, file doesn't exist - that's fine
          if (shaError.status !== 404 && shaError.response?.status !== 404) {
            throw new Error(`Failed to check if file exists: ${shaError.message}`)
          }
        }

        await uploadLogoFile(
          repoOwnerFromLink,
          repoNameFromLink,
          filePath,
          pending.base64,
          existingSha || undefined
        )
      }

      // Update registry entry
      updatePagesData((data) => {
        const updated = { ...data }
        if (updated.logoRegistry) {
          updated.logoRegistry = {
            ...updated.logoRegistry,
            [key]: {
              ...entry,
              description: newDescription,
              path: newPath,
            },
          }
        }
        return updated
      })

      setEditingKey(null)
    } catch (err) {
      setError((err as Error).message || "Failed to update logo")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteLogo = (key: string) => {
    const entry = logoRegistry[key]
    if (!entry) return

    if (!pagesData || !sectionsData) return

    const { inUse, locations } = isLogoInUse(entry.path, pagesData, sectionsData)
    
    if (inUse) {
      setError(
        `Cannot delete logo: It is used in ${locations.join(", ")}. Please remove references first.`
      )
      return
    }

    updatePagesData((data) => {
      const updated = { ...data }
      if (updated.logoRegistry) {
        const { [key]: _, ...rest } = updated.logoRegistry
        updated.logoRegistry = rest
      }
      return updated
    })
  }

  // Debug: Log repo info
  useEffect(() => {
    if (!repoOwnerFromLink || !repoNameFromLink) {
      console.warn('⚠️ Logo Registry: Repository info not available', {
        repoOwnerFromLink,
        repoNameFromLink
      })
    } else {
      console.log('✅ Logo Registry: Repository info available', {
        repoOwnerFromLink,
        repoNameFromLink
      })
    }
  }, [repoOwnerFromLink, repoNameFromLink])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Logo Registry</h3>
          <p className="text-sm text-muted-foreground">
            Manage logos that can be used across pages, sections, and layouts.
          </p>
          {(!repoOwnerFromLink || !repoNameFromLink) && (
            <p className="text-xs text-yellow-600 mt-1">
              ⚠️ Repository not configured. Logo previews may not work. Please configure organization settings.
            </p>
          )}
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Logo
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(logoRegistry).map(([key, entry]) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{key}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingKey(key)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteLogo(key)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-32 w-full bg-muted rounded-md flex items-center justify-center overflow-hidden border">
                  <img
                    src={getLogoPreviewUrl(entry.path, repoOwnerFromLink ?? undefined, repoNameFromLink ?? undefined)}
                    alt={entry.description}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex flex-col items-center justify-center text-xs text-muted-foreground p-4">
                            <svg class="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Image not found</span>
                            <span class="text-xs mt-1 break-all">Path: ${entry.path}</span>
                            <span class="text-xs">Repo: ${repoOwnerFromLink || 'N/A'}/${repoNameFromLink || 'N/A'}</span>
                            <span class="text-xs">URL: ${getLogoPreviewUrl(entry.path, repoOwnerFromLink ?? undefined, repoNameFromLink ?? undefined)}</span>
                          </div>
                        `
                      }
                      console.error('❌ Failed to load logo:', {
                        path: entry.path,
                        url: getLogoPreviewUrl(entry.path, repoOwnerFromLink ?? undefined, repoNameFromLink ?? undefined),
                        repoOwner: repoOwnerFromLink,
                        repoName: repoNameFromLink
                      })
                    }}
                    onLoad={() => {
                      console.log('✅ Logo loaded successfully:', {
                        path: entry.path,
                        url: getLogoPreviewUrl(entry.path, repoOwnerFromLink ?? undefined, repoNameFromLink ?? undefined),
                        repoOwner: repoOwnerFromLink,
                        repoName: repoNameFromLink
                      })
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type: {entry.type}</p>
                  <p className="text-xs text-muted-foreground truncate">{entry.path}</p>
                  <p className="text-sm mt-1">{entry.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Logo</DialogTitle>
            <DialogDescription>
              Upload a new logo file to add to the registry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="logo-file">Logo File</Label>
              <Input
                id="logo-file"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                disabled={uploading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddLogo} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Add Logo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingKey && logoRegistry[editingKey] && (
        <EditLogoDialog
          key={editingKey}
          logoKey={editingKey}
          entry={logoRegistry[editingKey]}
          onSave={(description, file) => handleEditLogo(editingKey, description, file)}
          onClose={() => setEditingKey(null)}
          uploading={uploading}
          repoOwner={repoOwnerFromLink ?? undefined}
          repoName={repoNameFromLink ?? undefined}
        />
      )}
    </div>
  )
}

function EditLogoDialog({
  logoKey,
  entry,
  onSave,
  onClose,
  uploading,
  repoOwner,
  repoName,
}: {
  logoKey: string
  entry: LogoRegistryEntry
  onSave: (description: string, file?: File) => void
  onClose: () => void
  uploading: boolean
  repoOwner?: string
  repoName?: string
}) {
  const [description, setDescription] = useState(entry.description)
  const [file, setFile] = useState<File | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    
    // Create local preview URL
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setLocalPreview(url)
    } else {
      if (localPreview) {
        URL.revokeObjectURL(localPreview)
      }
      setLocalPreview(null)
    }
  }

  const handleSave = () => {
    onSave(description, file || undefined)
  }

  // Cleanup local preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview)
      }
    }
  }, [localPreview])

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Logo: {logoKey}</DialogTitle>
          <DialogDescription>
            Update logo description or replace the image file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="logo-description">Description</Label>
            <Textarea
              id="logo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
            />
          </div>
          <div>
            <Label htmlFor="logo-file-replace">Replace Image (optional)</Label>
              <Input
                id="logo-file-replace"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            {(localPreview || entry.path) && (
              <div className="h-32 w-full bg-muted rounded-md flex items-center justify-center overflow-hidden border">
                {localPreview ? (
                  <img
                    src={localPreview}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <img
                    src={getLogoPreviewUrl(entry.path, repoOwner, repoName)}
                    alt={entry.description}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex flex-col items-center justify-center text-xs text-muted-foreground p-4">
                            <svg class="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Image not found</span>
                            <span class="text-xs mt-1">Path: ${entry.path}</span>
                            <span class="text-xs">Repo: ${repoOwner}/${repoName || 'N/A'}</span>
                          </div>
                        `
                      }
                    }}
                    onLoad={() => {
                      console.log('✅ Logo loaded successfully:', {
                        path: entry.path,
                        url: getLogoPreviewUrl(entry.path, repoOwner, repoName),
                        repoOwner,
                        repoName
                      })
                    }}
                  />
                )}
              </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

