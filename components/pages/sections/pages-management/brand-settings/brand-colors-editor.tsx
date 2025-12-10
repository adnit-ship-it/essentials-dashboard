"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { saveBrandingColors } from "@/lib/services/branding"
import { isValidHex, normalizeHexForSave } from "@/lib/utils/colors"

type BrandingColors = {
  backgroundColor: string
  bodyColor: string
  accentColor1: string
  accentColor2: string
}

const DEFAULT_COLORS: BrandingColors = {
  backgroundColor: "#FDFAF6",
  bodyColor: "#000000",
  accentColor1: "#A75809",
  accentColor2: "#F8F2EC",
}

export function BrandColorsEditor() {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [colors, setColors] = useState<BrandingColors>(DEFAULT_COLORS)
  const [colorInputs, setColorInputs] = useState<BrandingColors>(DEFAULT_COLORS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tailwindSha, setTailwindSha] = useState<string | null>(null)

  // Load colors and tailwind SHA on mount
  useEffect(() => {
    const loadColors = async () => {
      if (!repoOwnerFromLink || !repoNameFromLink) return

      try {
        // Fetch branding data to get current colors and SHA
        // Use relative URLs in browser to avoid CORS issues
        const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
        const response = await fetch(
          `${API_BASE_URL}/api/branding?owner=${encodeURIComponent(repoOwnerFromLink)}&repo=${encodeURIComponent(repoNameFromLink)}`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.colors) {
            setColors(data.colors)
            setColorInputs(data.colors)
          }
          if (data.sha) {
            setTailwindSha(data.sha)
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error("Failed to load brand colors:", errorData.error || "Unknown error")
        }
      } catch (err) {
        console.error("Failed to load brand colors:", err)
      }
    }

    loadColors()
  }, [repoOwnerFromLink, repoNameFromLink])

  const handleColorPickerChange = (key: keyof BrandingColors, value: string) => {
    const normalized = normalizeHexForSave(value)
    setColors((prev) => ({ ...prev, [key]: normalized }))
    setColorInputs((prev) => ({ ...prev, [key]: normalized }))
  }

  const handleColorTextChange = (key: keyof BrandingColors, value: string) => {
    setColorInputs((prev) => ({ ...prev, [key]: value }))
  }

  const handleColorTextBlur = (key: keyof BrandingColors) => {
    const input = colorInputs[key]
    if (isValidHex(input)) {
      const normalized = normalizeHexForSave(input)
      setColors((prev) => ({ ...prev, [key]: normalized }))
      setColorInputs((prev) => ({ ...prev, [key]: normalized }))
    } else {
      setColorInputs((prev) => ({ ...prev, [key]: colors[key] }))
    }
  }

  const handleSave = async () => {
    if (!repoOwnerFromLink || !repoNameFromLink) {
      setError("Repository not configured")
      return
    }

    if (!tailwindSha) {
      setError("Tailwind config SHA not available. Please try again.")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await saveBrandingColors(repoOwnerFromLink, repoNameFromLink, colors, tailwindSha)
      setTailwindSha(result.newSha)
      setSuccess("Brand colors saved successfully!")
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      setError(err?.message || "Failed to save brand colors")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Colors</CardTitle>
        <CardDescription>
          Adjust the brand colors used throughout the product. These are saved to tailwind.config.js
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <Button onClick={handleSave} disabled={saving} className="gap-2">
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
      </CardContent>
    </Card>
  )
}

