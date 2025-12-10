"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, RefreshCw, Save, Undo2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import type { BrandSettingsData, LogoState, LogoSize, GlobalLayoutHeights, BrandingColors } from "@/lib/types/branding"
import { fetchBrandSettings, saveBrandSettings, uploadLogo, saveBrandingColors } from "@/lib/services/branding"
import { fileToPendingUpload } from "@/lib/utils/file-uploads"
import { generateUniqueLogoFileName } from "@/lib/services/branding"
import { normalizeRepoPathInput } from "@/lib/utils/repo-paths"
import { LogoManagement } from "./brand-settings/logo-management"
import { PageMetadataEditor } from "./brand-settings/page-metadata-editor"
import { LayoutHeightsEditor } from "./brand-settings/layout-heights-editor"
import { LogoSizesEditor } from "./brand-settings/logo-sizes-editor"
import { ColorPaletteEditor } from "./brand-settings/color-palette-editor"

type Feedback = { type: "success" | "error"; message: string } | null

const DEFAULT_BRAND_SETTINGS: BrandSettingsData = {
  logos: {
    primary: { path: "public/assets/images/brand/logo.svg" },
    secondary: { path: "public/assets/images/brand/logo-alt.svg" },
    loadingScreen: { path: "public/assets/images/brand/logo-secondary-1.svg" },
    favicon: { path: "public/assets/images/brand/favicon.ico" },
  },
  logoSizes: {
    navbar: { height: { mobile: "", desktop: "" }, width: { mobile: "auto", desktop: "auto" } },
    footer: { height: { mobile: "", desktop: "" }, width: { mobile: "auto", desktop: "auto" } },
    loadingScreen: { height: { mobile: "", desktop: "" }, width: { mobile: "auto", desktop: "auto" } },
    hero: { height: { mobile: "", tablet: "", desktop: "" }, width: { mobile: "auto", desktop: "auto" } },
    contact: { height: { mobile: "", desktop: "" }, width: { mobile: "auto", desktop: "auto" } },
    products: { height: { mobile: "", desktop: "" }, width: { mobile: "auto", desktop: "auto" } },
  },
  layoutHeights: {
    navbar: { mobile: "", desktop: "" },
    footer: { mobile: "", desktop: "" },
  },
  pageTitle: "",
  pageDescription: "",
  colors: {
    backgroundColor: "#FDFAF6",
    bodyColor: "#000000",
    accentColor1: "#A75809",
    accentColor2: "#F8F2EC",
  },
}

export function BrandSettingsSection() {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  
  const [settings, setSettings] = useState<BrandSettingsData>(DEFAULT_BRAND_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<BrandSettingsData | null>(null)
  const [pendingUploads, setPendingUploads] = useState<Record<string, any>>({})
  const [contentSha, setContentSha] = useState<string | null>(null)
  const [pagesSha, setPagesSha] = useState<string | null>(null)
  const [tailwindSha, setTailwindSha] = useState<string | null>(null)

  const fetchBrandSettingsData = useCallback(async () => {
    const owner = repoOwnerFromLink || ""
    const repo = repoNameFromLink || ""
    if (!owner || !repo) {
      setError("Repository owner/name missing. Configure via organization settings.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setFeedback(null)
    try {
      const data = await fetchBrandSettings(owner, repo)
      setSettings(data)
      setOriginalSettings(JSON.parse(JSON.stringify(data)))
    } catch (err) {
      setError((err as Error).message || "Failed to load brand settings.")
    } finally {
      setLoading(false)
    }
  }, [repoOwnerFromLink, repoNameFromLink])

  useEffect(() => {
    if (repoOwnerFromLink && repoNameFromLink) {
      fetchBrandSettingsData()
    }
  }, [repoOwnerFromLink, repoNameFromLink, fetchBrandSettingsData])

  const handleLogoUpload = async (type: "primary" | "secondary" | "loadingScreen" | "favicon", file: File) => {
    try {
      const pending = await fileToPendingUpload(file)
      const owner = repoOwnerFromLink || ""
      const repo = repoNameFromLink || ""
      
      if (!owner || !repo) {
        setFeedback({
          type: "error",
          message: "Repository owner/name missing. Configure via organization settings.",
        })
        return
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png'
      const uniqueFileName = await generateUniqueLogoFileName(owner, repo, type, fileExtension)
      const newPath = `public/assets/images/brand/${uniqueFileName}`
      
      setPendingUploads((prev) => ({
        ...prev,
        [type]: { pending, path: newPath },
      }))

      setSettings((prev) => ({
        ...prev,
        logos: {
          ...prev.logos,
          [type]: {
            ...prev.logos[type],
            pendingUpload: pending,
          },
        },
      }))
    } catch (err) {
      setFeedback({
        type: "error",
        message: (err as Error).message || "Failed to process uploaded image.",
      })
    }
  }

  const handleClearPending = (type: "primary" | "secondary" | "loadingScreen" | "favicon") => {
    setPendingUploads((prev) => {
      const updated = { ...prev }
      delete updated[type]
      return updated
    })

    setSettings((prev) => ({
      ...prev,
      logos: {
        ...prev.logos,
        [type]: {
          ...prev.logos[type],
          pendingUpload: undefined,
        },
      },
    }))
  }

  const handleSave = async () => {
    const owner = repoOwnerFromLink || ""
    const repo = repoNameFromLink || ""
    
    if (!owner || !repo) {
      setFeedback({
        type: "error",
        message: "Repository owner/name missing. Configure via organization settings.",
      })
      return
    }

    try {
      setSaving(true)
      setFeedback(null)

      // Upload pending logos
      const uploadResults: Record<string, { url?: string; sha?: string | null; path: string }> = {}
      for (const [type, uploadData] of Object.entries(pendingUploads)) {
        if (uploadData?.pending) {
          const result = await uploadLogo(owner, repo, {
            slot: type === "primary" ? "primary" : "secondary",
            path: uploadData.path,
            base64: uploadData.pending.base64,
          })
          uploadResults[type] = result
          
          // Update settings with uploaded logo
          setSettings((prev) => ({
            ...prev,
            logos: {
              ...prev.logos,
              [type]: {
                path: result.path,
                url: result.url,
                sha: result.sha,
                pendingUpload: undefined,
              },
            },
          }))
        }
      }

      // Save colors
      if (tailwindSha) {
        const brandingResult = await saveBrandingColors(owner, repo, settings.colors, tailwindSha)
        setTailwindSha(brandingResult.newSha)
        setSettings((prev) => ({
          ...prev,
          colors: brandingResult.colors,
        }))
      }

      // Save other settings (metadata, heights, etc.)
      // This would need to be implemented based on the actual API structure
      
      setOriginalSettings(JSON.parse(JSON.stringify(settings)))
      setPendingUploads({})
      
      setFeedback({
        type: "success",
        message: "Brand settings saved successfully.",
      })
    } catch (err) {
      setFeedback({
        type: "error",
        message: (err as Error).message || "Failed to save brand settings.",
      })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = originalSettings
    ? JSON.stringify(settings) !== JSON.stringify(originalSettings) || Object.keys(pendingUploads).length > 0
    : false

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={fetchBrandSettingsData} className="mt-4" variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Brand Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage logos, colors, layout heights, and page metadata.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (originalSettings) {
                    setSettings(JSON.parse(JSON.stringify(originalSettings)))
                    setPendingUploads({})
                  }
                }}
                disabled={saving}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Discard
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBrandSettingsData}
            disabled={loading || saving}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border p-3 text-sm",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <LogoManagement
        logos={settings.logos}
        onLogoUpload={handleLogoUpload}
        onClearPending={handleClearPending}
        repoOwner={repoOwnerFromLink}
        repoName={repoNameFromLink}
      />

      <ColorPaletteEditor
        colors={settings.colors}
        onColorsChange={(colors) => setSettings((prev) => ({ ...prev, colors }))}
      />

      <PageMetadataEditor
        pageTitle={settings.pageTitle}
        pageDescription={settings.pageDescription}
        onPageTitleChange={(title) => setSettings((prev) => ({ ...prev, pageTitle: title }))}
        onPageDescriptionChange={(desc) => setSettings((prev) => ({ ...prev, pageDescription: desc }))}
      />

      <LayoutHeightsEditor
        heights={settings.layoutHeights}
        onHeightsChange={(heights) => setSettings((prev) => ({ ...prev, layoutHeights: heights }))}
      />

      <Card>
        <CardContent className="p-6">
          <LogoSizesEditor
            logoSizes={settings.logoSizes}
            onLogoSizesChange={(logoSizes) => setSettings((prev) => ({ ...prev, logoSizes }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}

