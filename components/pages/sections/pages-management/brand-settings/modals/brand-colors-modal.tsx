"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useBrandColorsStore } from "@/lib/stores/brand-colors-store"
import { saveBrandingColors } from "@/lib/services/branding"
import { isValidHex, normalizeHexForSave } from "@/lib/utils/colors"
import type { BrandingColors } from "@/lib/types/branding"

function makeRepoKey(owner: string, repo: string): string {
  return owner && repo ? `${owner}/${repo}` : ""
}

interface BrandColorsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BrandColorsModal({ open, onOpenChange }: BrandColorsModalProps) {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const storeColors = useBrandColorsStore((s) => s.colors)
  const designTokensSha = useBrandColorsStore((s) => s.designTokensSha)
  const loading = useBrandColorsStore((s) => s.loading)
  const repoKey = useBrandColorsStore((s) => s.repoKey)
  const fetchBrandColors = useBrandColorsStore((s) => s.fetchBrandColors)

  const [colors, setColors] = useState<BrandingColors | null>(null)
  const [colorInputs, setColorInputs] = useState<BrandingColors | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const currentRepoKey = makeRepoKey(repoOwnerFromLink || "", repoNameFromLink || "")
  const storeHasDataForRepo = storeColors && repoKey === currentRepoKey && currentRepoKey

  // Sync editing state from store when modal opens and store has data
  useEffect(() => {
    if (!open) return
    if (storeHasDataForRepo && storeColors) {
      setColors(storeColors)
      setColorInputs(storeColors)
    } else {
      setColors(null)
      setColorInputs(null)
    }
  }, [open, storeHasDataForRepo, storeColors])

  // Trigger fetch when modal opens if store is empty or loading for this repo
  useEffect(() => {
    if (!open || !repoOwnerFromLink || !repoNameFromLink) return
    if (!storeHasDataForRepo || loading) {
      fetchBrandColors()
    }
  }, [open, repoOwnerFromLink, repoNameFromLink, storeHasDataForRepo, loading, fetchBrandColors])

  const handleColorPickerChange = (key: keyof BrandingColors, value: string) => {
    const normalized = normalizeHexForSave(value)
    setColors((prev) => (prev ? { ...prev, [key]: normalized } : null))
    setColorInputs((prev) => (prev ? { ...prev, [key]: normalized } : null))
  }

  const handleColorTextChange = (key: keyof BrandingColors, value: string) => {
    setColorInputs((prev) => (prev ? { ...prev, [key]: value } : null))
  }

  const handleColorTextBlur = (key: keyof BrandingColors) => {
    const input = colorInputs?.[key]
    if (input === undefined || !colors) return
    if (isValidHex(input)) {
      const normalized = normalizeHexForSave(input)
      setColors((prev) => (prev ? { ...prev, [key]: normalized } : null))
      setColorInputs((prev) => (prev ? { ...prev, [key]: normalized } : null))
    } else {
      setColorInputs((prev) => (prev ? { ...prev, [key]: colors[key] } : null))
    }
  }

  const handleSave = async () => {
    if (!repoOwnerFromLink || !repoNameFromLink) {
      setError("Repository not configured")
      return
    }
    if (!colors) return
    if (!designTokensSha) {
      setError("Tailwind config SHA not available. Please try again.")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await saveBrandingColors(repoOwnerFromLink, repoNameFromLink, colors, designTokensSha)
      useBrandColorsStore.getState().setBrandColors(result.colors, result.newSha)
      setColors(result.colors)
      setColorInputs(result.colors)
      setSuccess("Brand colors saved successfully!")
      setTimeout(() => {
        setSuccess(null)
        onOpenChange(false)
      }, 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save brand colors")
    } finally {
      setSaving(false)
    }
  }

  const showLoading = open && (!storeHasDataForRepo || loading) && !colors
  const showForm = open && colors && colorInputs

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Brand Colors</DialogTitle>
          <DialogDescription>
            Adjust the brand colors used throughout the product. These are saved to tailwind.config.js
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {showLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {showForm && (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {(Object.keys(colors) as Array<keyof BrandingColors>).map((key) => (
                  <div key={key} className="space-y-2">
                    <Label className="uppercase text-xs text-muted-foreground">
                      {key.replace(/([A-Z])/g, " $1")}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={colors[key]}
                        onChange={(event) => handleColorPickerChange(key, event.target.value)}
                        className="h-10 w-12 cursor-pointer p-1"
                      />
                      <Input
                        value={colorInputs[key]}
                        onChange={(event) => handleColorTextChange(key, event.target.value)}
                        onBlur={() => handleColorTextBlur(key)}
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                ))}
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

              <Button onClick={handleSave} disabled={saving} className="gap-2 w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Colors
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
