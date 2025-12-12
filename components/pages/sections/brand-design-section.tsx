"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  Undo2,
  Upload,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import type {
  BrandingColors,
  HeroLogoHeights,
  LogoSlot,
  LogoState,
  PageKey,
  LogoHeights,
} from "@/lib/types/branding"
import { fileToPendingUpload } from "@/lib/utils/file-uploads"
import { isValidHex, normalizeHexForSave } from "@/lib/utils/colors"
import {
  normalizeRepoPathInput,
  assetSrcToRepoPath,
  repoPathToAssetSrc,
} from "@/lib/utils/repo-paths"
import { extractNumericValue, formatWithPx } from "@/lib/utils/logo-heights"
import {
  fetchBrandingData,
  uploadLogo,
  saveBrandingColors,
  saveContent,
  generateUniqueLogoFileName,
} from "@/lib/services/branding"

type Feedback = { type: "success" | "error"; message: string } | null

const DEFAULT_COLORS: BrandingColors = {
  backgroundColor: "#FDFAF6",
  bodyColor: "#000000",
  accentColor1: "#A75809",
  accentColor2: "#F8F2EC",
}

const LOGO_LABELS: Record<LogoSlot, string> = {
  primary: "Primary Logo",
  secondary: "Alternate Logo",
}

const LOGO_DESCRIPTIONS: Record<LogoSlot, string> = {
  primary: "Displayed across the application as the main logo.",
  secondary: "Used in contexts that require an alternate mark.",
}

const DEFAULT_LOGO_PATHS: Record<LogoSlot, string> = {
  primary: "public/assets/images/brand/logo.svg",
  secondary: "public/assets/images/brand/logo-alt.svg",
}

export function BrandDesignSection() {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [tailwindSha, setTailwindSha] = useState<string | null>(null)

  const [colors, setColors] = useState<BrandingColors>(DEFAULT_COLORS)
  const [colorInputs, setColorInputs] = useState<BrandingColors>(DEFAULT_COLORS)
  const [originalColors, setOriginalColors] =
    useState<BrandingColors | null>(null)

  const [logos, setLogos] = useState<Record<LogoSlot, LogoState>>({
    primary: { path: "" },
    secondary: { path: "" },
  })
  const [originalLogos, setOriginalLogos] =
    useState<Record<LogoSlot, LogoState> | null>(null)

  const [logoPaths, setLogoPaths] = useState<Record<LogoSlot, string>>({
    primary: DEFAULT_LOGO_PATHS.primary,
    secondary: DEFAULT_LOGO_PATHS.secondary,
  })
  const [logoPathInputs, setLogoPathInputs] = useState<Record<LogoSlot, string>>({
    primary: DEFAULT_LOGO_PATHS.primary,
    secondary: DEFAULT_LOGO_PATHS.secondary,
  })

  // Page title and logo heights state
  const [pageTitle, setPageTitle] = useState<string>("")
  const [originalPageTitle, setOriginalPageTitle] = useState<string | null>(null)
  const [contentSha, setContentSha] = useState<string | null>(null)
  
  // Logo heights state - now supports page-specific heights
  
  const [selectedPage, setSelectedPage] = useState<PageKey>("/")
  const [logoHeights, setLogoHeights] = useState<Record<PageKey, LogoHeights>>({
    "/": {
      navbar: { mobile: "", desktop: "" },
      navbarLogo: { mobile: "", tablet: "", desktop: "" },
      footer: { mobile: "", desktop: "" },
      footerLogo: { mobile: "", desktop: "" },
    },
    "/about": {
      navbar: { mobile: "", desktop: "" },
      navbarLogo: { mobile: "", tablet: "", desktop: "" },
      footer: { mobile: "", desktop: "" },
      footerLogo: { mobile: "", desktop: "" },
    },
    "/products": {
      navbar: { mobile: "", desktop: "" },
      navbarLogo: { mobile: "", tablet: "", desktop: "" },
      footer: { mobile: "", desktop: "" },
      footerLogo: { mobile: "", desktop: "" },
    },
    "/contact": {
      navbar: { mobile: "", desktop: "" },
      navbarLogo: { mobile: "", tablet: "", desktop: "" },
      footer: { mobile: "", desktop: "" },
      footerLogo: { mobile: "", desktop: "" },
    },
  })
  const [originalLogoHeights, setOriginalLogoHeights] = useState<Record<PageKey, LogoHeights> | null>(null)
  
  // Hero logo heights state
  const [heroLogoHeights, setHeroLogoHeights] = useState<HeroLogoHeights>({
    mobile: "",
    tablet: "",
    desktop: "",
  })
  const [originalHeroLogoHeights, setOriginalHeroLogoHeights] = useState<HeroLogoHeights | null>(null)
  
  // Hero logo state
  const [heroLogo, setHeroLogo] = useState<LogoState>({ path: "" })
  const [originalHeroLogo, setOriginalHeroLogo] = useState<LogoState | null>(null)
  const [heroLogoPath, setHeroLogoPath] = useState<string>("public/assets/images/brand/hero-logo.svg")
  const [heroLogoPathInput, setHeroLogoPathInput] = useState<string>("public/assets/images/brand/hero-logo.svg")
  
  const fetchBranding = useCallback(async () => {
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
      const data = await fetchBrandingData(owner, repo)

      setColors(data.colors)
      setColorInputs(data.colors)
      setOriginalColors(data.colors)

      setLogos(data.logos)
      setOriginalLogos({
        primary: { ...data.logos.primary },
        secondary: { ...data.logos.secondary },
      })
      setLogoPaths({
        primary: data.logos.primary.path || DEFAULT_LOGO_PATHS.primary,
        secondary: data.logos.secondary.path || DEFAULT_LOGO_PATHS.secondary,
      })
      setLogoPathInputs({
        primary: data.logos.primary.path || DEFAULT_LOGO_PATHS.primary,
        secondary: data.logos.secondary.path || DEFAULT_LOGO_PATHS.secondary,
      })

      setPageTitle(data.pageTitle)
      setOriginalPageTitle(data.pageTitle)
      setContentSha(data.contentSha)
      setLogoHeights(data.logoHeights)
      setOriginalLogoHeights(JSON.parse(JSON.stringify(data.logoHeights)))
      
      if (data.heroLogoHeights) {
        setHeroLogoHeights(data.heroLogoHeights)
        setOriginalHeroLogoHeights(JSON.parse(JSON.stringify(data.heroLogoHeights)))
      } else {
        setHeroLogoHeights({ mobile: "", tablet: "", desktop: "" })
        setOriginalHeroLogoHeights(null)
      }
      
      // Load hero logo
      if (data.heroLogo) {
        setHeroLogo(data.heroLogo)
        setOriginalHeroLogo({ ...data.heroLogo })
        const heroPath = data.heroLogo.path || "public/assets/images/brand/hero-logo.svg"
        setHeroLogoPath(heroPath)
        setHeroLogoPathInput(heroPath)
      }

      setTailwindSha(data.tailwindSha)
    } catch (err) {
      setError((err as Error).message || "Failed to load branding data.")
    } finally {
      setLoading(false)
    }
  }, [repoOwnerFromLink, repoNameFromLink])

  useEffect(() => {
    if (repoOwnerFromLink && repoNameFromLink) {
      // Reset state when repo changes
      setColors(DEFAULT_COLORS)
      setColorInputs(DEFAULT_COLORS)
      setOriginalColors(null)
      setLogos({
        primary: { path: "" },
        secondary: { path: "" },
      })
      setOriginalLogos(null)
      setLogoPaths({ ...DEFAULT_LOGO_PATHS })
      setLogoPathInputs({ ...DEFAULT_LOGO_PATHS })
      setTailwindSha(null)
      setPageTitle("")
      setOriginalPageTitle(null)
      setContentSha(null)
      setLogoHeights({
        "/": {
          navbar: { mobile: "", desktop: "" },
          navbarLogo: { mobile: "", tablet: "", desktop: "" },
          footer: { mobile: "", desktop: "" },
          footerLogo: { mobile: "", desktop: "" },
        },
        "/about": {
          navbar: { mobile: "", desktop: "" },
          navbarLogo: { mobile: "", tablet: "", desktop: "" },
          footer: { mobile: "", desktop: "" },
          footerLogo: { mobile: "", desktop: "" },
        },
        "/products": {
          navbar: { mobile: "", desktop: "" },
          navbarLogo: { mobile: "", tablet: "", desktop: "" },
          footer: { mobile: "", desktop: "" },
          footerLogo: { mobile: "", desktop: "" },
        },
        "/contact": {
          navbar: { mobile: "", desktop: "" },
          navbarLogo: { mobile: "", tablet: "", desktop: "" },
          footer: { mobile: "", desktop: "" },
          footerLogo: { mobile: "", desktop: "" },
        },
      })
      setOriginalLogoHeights(null)
      setSelectedPage("/")
      setFeedback(null)
      setError(null)
      // Fetch new data
      fetchBranding()
    }
  }, [repoOwnerFromLink, repoNameFromLink, fetchBranding])

  const hasColorChanges = useMemo(() => {
    if (!originalColors) return false
    return Object.entries(colors).some(
      ([key, value]) =>
        value.toLowerCase() !==
        originalColors[key as keyof BrandingColors]?.toLowerCase()
    )
  }, [colors, originalColors])

  const hasLogoChanges = useMemo(() => {
    return (
      Boolean(logos.primary.pendingUpload) ||
      Boolean(logos.secondary.pendingUpload) ||
      Boolean(heroLogo.pendingUpload)
    )
  }, [logos, heroLogo])

  const hasPageTitleChanges = useMemo(() => {
    if (originalPageTitle === null) return false
    return pageTitle !== originalPageTitle
  }, [pageTitle, originalPageTitle])

  const hasLogoHeightChanges = useMemo(() => {
    if (!originalLogoHeights) return false
    return JSON.stringify(logoHeights) !== JSON.stringify(originalLogoHeights)
  }, [logoHeights, originalLogoHeights])
  
  const hasHeroLogoHeightChanges = useMemo(() => {
    if (originalHeroLogoHeights === null) {
      // If original is null (no data exists), compare against empty default
      const emptyHeights: HeroLogoHeights = { mobile: "", tablet: "", desktop: "" }
      return JSON.stringify(heroLogoHeights) !== JSON.stringify(emptyHeights)
    }
    return JSON.stringify(heroLogoHeights) !== JSON.stringify(originalHeroLogoHeights)
  }, [heroLogoHeights, originalHeroLogoHeights])
  
  const currentPageHeights = logoHeights[selectedPage]

  const hasPendingChanges = hasColorChanges || hasLogoChanges || hasPageTitleChanges || hasLogoHeightChanges || hasHeroLogoHeightChanges

  const handleColorPickerChange = (key: keyof BrandingColors, value: string) => {
    setColors((prev) => ({
      ...prev,
      [key]: value.toUpperCase(),
    }))
    setColorInputs((prev) => ({
      ...prev,
      [key]: value.toUpperCase(),
    }))
  }

  const handleColorTextChange = (key: keyof BrandingColors, value: string) => {
    setColorInputs((prev) => ({
      ...prev,
      [key]: value,
    }))
    if (isValidHex(value)) {
      setColors((prev) => ({
        ...prev,
        [key]: value.toUpperCase(),
      }))
    }
  }

  const handleColorTextBlur = (key: keyof BrandingColors) => {
    setColorInputs((prev) => ({
      ...prev,
      [key]: colors[key],
    }))
  }

  const handleLogoUpload = async (slot: LogoSlot, file: File | null) => {
    if (!file) return
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
      
      // Generate a new unique filename with number
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png'
      const uniqueFileName = await generateUniqueLogoFileName(owner, repo, slot, fileExtension)
      const newPath = `public/assets/images/brand/${uniqueFileName}`
      const normalizedNewPath = normalizeRepoPathInput(newPath, DEFAULT_LOGO_PATHS[slot])
      
      // Update the path inputs to reflect the new unique path
      setLogoPathInputs((prev) => ({
        ...prev,
        [slot]: normalizedNewPath,
      }))
      setLogoPaths((prev) => ({
        ...prev,
        [slot]: normalizedNewPath,
      }))
      
      setLogos((prev) => ({
        ...prev,
        [slot]: {
          ...prev[slot],
          pendingUpload: pending,
        },
      }))
    } catch (err) {
      setFeedback({
        type: "error",
        message: (err as Error).message || "Failed to process uploaded image.",
      })
    }
  }

  const clearPendingLogo = (slot: LogoSlot) => {
    setLogos((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        pendingUpload: undefined,
      },
    }))
  }

  const handleHeroLogoUpload = async (file: File | null) => {
    if (!file) return
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
      
      // Generate a new unique filename with number
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png'
      const uniqueFileName = await generateUniqueLogoFileName(owner, repo, "hero", fileExtension)
      const newPath = `public/assets/images/brand/${uniqueFileName}`
      const normalizedNewPath = normalizeRepoPathInput(newPath, "public/assets/images/brand/hero-logo.svg")
      
      // Update the path inputs to reflect the new unique path
      setHeroLogoPathInput(normalizedNewPath)
      setHeroLogoPath(normalizedNewPath)
      
      setHeroLogo((prev) => ({
        ...prev,
        pendingUpload: pending,
      }))
    } catch (err) {
      setFeedback({
        type: "error",
        message: (err as Error).message || "Failed to process uploaded image.",
      })
    }
  }

  const clearPendingHeroLogo = () => {
    setHeroLogo((prev) => ({
      ...prev,
      pendingUpload: undefined,
    }))
  }

  const handleLogoPathChange = (slot: LogoSlot, value: string) => {
    setLogoPathInputs((prev) => ({
      ...prev,
      [slot]: value,
    }))
  }

  const handleLogoPathBlur = (slot: LogoSlot) => {
    setLogoPathInputs((prev) => {
      const normalized = normalizeRepoPathInput(
        prev[slot],
        logoPaths[slot] || DEFAULT_LOGO_PATHS[slot]
      )
      setLogoPaths((paths) => ({
        ...paths,
        [slot]: normalized,
      }))
      return {
        ...prev,
        [slot]: normalized,
      }
    })
  }

  const handleDiscardAll = () => {
    if (originalColors) {
      setColors(originalColors)
      setColorInputs(originalColors)
    }
    if (originalLogos) {
      const restoredLogos = {
        primary: { ...originalLogos.primary, pendingUpload: undefined },
        secondary: { ...originalLogos.secondary, pendingUpload: undefined },
      }
      setLogos(restoredLogos)
      setLogoPaths({
        primary: restoredLogos.primary.path || DEFAULT_LOGO_PATHS.primary,
        secondary: restoredLogos.secondary.path || DEFAULT_LOGO_PATHS.secondary,
      })
      setLogoPathInputs({
        primary: restoredLogos.primary.path || DEFAULT_LOGO_PATHS.primary,
        secondary: restoredLogos.secondary.path || DEFAULT_LOGO_PATHS.secondary,
      })
    }
    if (originalPageTitle !== null) {
      setPageTitle(originalPageTitle)
    }
    if (originalLogoHeights) {
      setLogoHeights(JSON.parse(JSON.stringify(originalLogoHeights)))
    }
    if (originalHeroLogoHeights) {
      setHeroLogoHeights(JSON.parse(JSON.stringify(originalHeroLogoHeights)))
    }
    if (originalHeroLogo) {
      setHeroLogo({ ...originalHeroLogo, pendingUpload: undefined })
      setHeroLogoPath(originalHeroLogo.path || "public/assets/images/brand/hero-logo.svg")
      setHeroLogoPathInput(originalHeroLogo.path || "public/assets/images/brand/hero-logo.svg")
    }
    setFeedback(null)
  }

  const handleSave = async () => {
    if (!tailwindSha) {
      setFeedback({
        type: "error",
        message: "Missing tailwind config SHA. Refresh and try again.",
      })
      return
    }

    try {
      // Collect all logo uploads including hero logo
      // Always creating new files, so no need for SHA or path comparison logic
      const logoUploads = (["primary", "secondary"] as LogoSlot[])
        .filter((slot) => logos[slot].pendingUpload)
        .map((slot) => {
          const desiredPath = normalizeRepoPathInput(
            logoPathInputs[slot] || logoPaths[slot] || "",
            DEFAULT_LOGO_PATHS[slot]
          )
          return {
            slot,
            path: desiredPath,
            base64: logos[slot].pendingUpload!.base64,
          }
        })

      // Add hero logo upload if pending
      if (heroLogo.pendingUpload) {
        const desiredPath = normalizeRepoPathInput(
          heroLogoPathInput || heroLogoPath || "",
          "public/assets/images/brand/hero-logo.svg"
        )
        logoUploads.push({
          slot: "primary" as LogoSlot, // Use primary slot for hero logo upload
          path: desiredPath,
          base64: heroLogo.pendingUpload.base64,
        })
      }

      setSaving(true)
      setFeedback(null)

      const uploadResults = new Map<LogoSlot, { url?: string; sha?: string | null; path: string }>()
      let heroLogoUploadResult: { url?: string; sha?: string | null; path: string } | null = null

      const owner = repoOwnerFromLink || ""
      const repo = repoNameFromLink || ""

      // Upload logos using service - always creating new files, no SHA conflicts
      for (const upload of logoUploads) {
        try {
          const result = await uploadLogo(owner, repo, upload)
          // Check if this is the hero logo upload (by checking if path matches hero logo path)
          if (upload.path === (heroLogoPathInput || heroLogoPath)) {
            heroLogoUploadResult = result
          } else {
            uploadResults.set(upload.slot, result)
          }
        } catch (err) {
          // No need for SHA retry logic - always creating new files
          throw err
        }
      }

      // Save colors using service
      const brandingResult = await saveBrandingColors(owner, repo, colors, tailwindSha)
      const nextTailwindSha = brandingResult.newSha

      // Update colors from the response
      setColors(brandingResult.colors)
      setColorInputs(brandingResult.colors)
      setOriginalColors(brandingResult.colors)
      setTailwindSha(nextTailwindSha)

      // Update hero logo if uploaded
      if (heroLogoUploadResult) {
        setHeroLogo((prev) => ({
          ...prev,
          path: heroLogoUploadResult!.path,
          url: heroLogoUploadResult!.url,
          sha: heroLogoUploadResult!.sha,
          pendingUpload: undefined,
        }))
        setHeroLogoPath(heroLogoUploadResult.path)
        setHeroLogoPathInput(heroLogoUploadResult.path)
        setOriginalHeroLogo({
          path: heroLogoUploadResult.path,
          url: heroLogoUploadResult.url,
          sha: heroLogoUploadResult.sha,
        })
      }

      // Update logos with new SHA and URL from upload results
      if (logoUploads.length > 0) {
        // Update logos state immediately with the new URLs, SHAs, and paths
        setLogos((prev) => {
          const updated = { ...prev }
          for (const [slot, result] of uploadResults.entries()) {
            if (result.url && result.sha) {
              updated[slot] = {
                ...updated[slot],
                path: result.path,
                url: result.url,
                sha: result.sha,
                pendingUpload: undefined, // Clear pending upload
              }
            } else {
              console.warn(`⚠️ Missing URL or SHA for ${slot} logo:`, result)
            }
          }
          return updated
        })
        setLogoPaths((prev) => {
          const updated = { ...prev }
          for (const [slot, result] of uploadResults.entries()) {
            updated[slot] = result.path
          }
          return updated
        })
        setLogoPathInputs((prev) => {
          const updated = { ...prev }
          for (const [slot, result] of uploadResults.entries()) {
            updated[slot] = result.path
          }
          return updated
        })
        
        // Also update original logos to match
        setOriginalLogos((prev) => {
          if (!prev) return prev
          const updated = { ...prev }
          for (const [slot, result] of uploadResults.entries()) {
            if (result.url && result.sha && prev[slot]) {
              updated[slot] = {
                ...prev[slot],
                path: result.path,
                url: result.url,
                sha: result.sha,
              }
            }
          }
          return updated
        })

        // Don't refresh immediately - we already have the correct URLs and SHAs from the upload
        // The URLs include cache-busting parameters (SHA) so they'll show the new image
        // Only refresh if user manually refreshes the page or switches repos
      }

      // Save pageTitle, logo heights, hero logo heights, and logo paths if they changed
      const hasLogoPathChanges = uploadResults.size > 0 || heroLogoUploadResult !== null
      if ((hasPageTitleChanges || hasLogoHeightChanges || hasHeroLogoHeightChanges || hasLogoPathChanges) && contentSha) {
        const logoPathsToSave: Record<LogoSlot, string> | undefined = 
          uploadResults.size > 0
            ? {
                primary: uploadResults.get("primary")?.path || logoPaths.primary,
                secondary: uploadResults.get("secondary")?.path || logoPaths.secondary,
              }
            : undefined

        const heroLogoPathToSave = heroLogoUploadResult?.path || (heroLogo.path && heroLogo.path !== "public/assets/images/brand/hero-logo.svg" ? heroLogo.path : undefined)

        const result = await saveContent(owner, repo, contentSha, {
          pageTitle: hasPageTitleChanges ? pageTitle : undefined,
          logoHeights: hasLogoHeightChanges ? logoHeights : undefined,
          heroLogoHeights: hasHeroLogoHeightChanges ? heroLogoHeights : undefined,
          logoPaths: logoPathsToSave,
          heroLogoPath: heroLogoPathToSave,
        })
        
        // Update state
        if (hasPageTitleChanges) {
          setOriginalPageTitle(pageTitle)
        }
        if (hasLogoHeightChanges) {
          setOriginalLogoHeights(logoHeights)
        }
        if (hasHeroLogoHeightChanges) {
          setOriginalHeroLogoHeights(heroLogoHeights)
        }
        setContentSha(result.sha)
      }

      const successMessages: string[] = []
      if (hasColorChanges || hasLogoChanges) {
        successMessages.push(logoUploads.length > 0 ? "Brand colors and logos" : "Brand colors")
      }
      if (hasPageTitleChanges) {
        successMessages.push("page title")
      }
      if (hasLogoHeightChanges) {
        successMessages.push("logo heights")
      }
      if (hasHeroLogoHeightChanges) {
        successMessages.push("hero logo heights")
      }
      if (heroLogoUploadResult) {
        successMessages.push("hero logo")
      }
      if (uploadResults.size > 0) {
        successMessages.push("logo paths")
      }
      
      setFeedback({
        type: "success",
        message: `${successMessages.join(", ")} saved successfully.`,
      })
    } catch (err) {
      setFeedback({
        type: "error",
        message: (err as Error).message || "Failed to save branding changes.",
      })
    } finally {
      setSaving(false)
    }
  }

  const renderLogoCard = (slot: LogoSlot) => {
    const logo = logos[slot]
    const pending = logo.pendingUpload
    // Use pending upload data URL if available, otherwise use the logo URL
    // The URL already includes cache-busting via SHA (?v=sha)
    const preview = pending?.dataUrl || logo.url

    return (
      <Card key={slot}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>{LOGO_LABELS[slot]}</CardTitle>
            <CardDescription>{LOGO_DESCRIPTIONS[slot]}</CardDescription>
          </div>
          {pending && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
              Image pending
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
            {preview ? (
              <img
                key={`${slot}-${logo.sha || 'no-sha'}`}
                src={preview}
                alt={`${LOGO_LABELS[slot]} preview`}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  console.error(`❌ Failed to load ${slot} logo:`, preview)
                  console.error('Logo state:', logo)
                }}
                onLoad={() => {
                  console.log(`✅ Successfully loaded ${slot} logo:`, preview)
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="h-6 w-6" />
                <span>No image available</span>
              </div>
            )}
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="break-all">{logo.path || "Path not configured"}</p>
            {logo.url && !pending && (
              <a
                href={logo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View current image
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase">
              Repository Path
            </Label>
            <Input
              value={logoPathInputs[slot]}
              onChange={(event) => handleLogoPathChange(slot, event.target.value)}
              onBlur={() => handleLogoPathBlur(slot)}
              placeholder="public/assets/images/brand/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Stored relative to <code>public/</code> in your repo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              id={`logo-upload-${slot}`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                if (file) {
                  void handleLogoUpload(slot, file)
                }
                event.target.value = ""
              }}
            />
            <Button
              type="button"
              asChild
              className="bg-transparent text-muted-foreground hover:bg-muted"
            >
              <label
                htmlFor={`logo-upload-${slot}`}
                className="flex cursor-pointer items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {pending ? "Replace image" : "Upload image"}
              </label>
            </Button>
            {pending && (
              <Button
                type="button"
                className="bg-transparent text-muted-foreground hover:bg-muted"
                onClick={() => clearPendingLogo(slot)}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Remove upload
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Brand &amp; Design</h3>
          <p className="text-sm text-muted-foreground">
            Stage updates to brand colors and logos, then push them to the content
            repository.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBranding}
          disabled={loading || !repoOwnerFromLink || !repoNameFromLink}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
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

      {loading ? (
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Failed to load branding data
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchBranding} className="gap-2">
              <Loader2 className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {(["primary", "secondary"] as LogoSlot[]).map(renderLogoCard)}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Adjust the fallback colors used throughout the product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {(Object.keys(colors) as Array<keyof BrandingColors>).map(
                  (key) => (
                    <div key={key} className="space-y-2">
                      <Label className="uppercase text-xs text-muted-foreground">
                        {key.replace(/([A-Z])/g, " $1")}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={colors[key]}
                          onChange={(event) =>
                            handleColorPickerChange(key, event.target.value)
                          }
                          className="h-10 w-12 cursor-pointer p-1"
                        />
                        <Input
                          value={colorInputs[key]}
                          onChange={(event) =>
                            handleColorTextChange(key, event.target.value)
                          }
                          onBlur={() => handleColorTextBlur(key)}
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Page Title</CardTitle>
              <CardDescription>
                The title displayed in the browser tab and page metadata.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="page-title">Page Title</Label>
                <Input
                  id="page-title"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="Enter page title"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Hero Logo</CardTitle>
                <CardDescription>
                  The logo displayed in the hero section on the home page.
                </CardDescription>
              </div>
              {heroLogo.pendingUpload && (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                  Image pending
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
                {heroLogo.pendingUpload?.dataUrl || heroLogo.url ? (
                  <img
                    src={heroLogo.pendingUpload?.dataUrl || heroLogo.url}
                    alt="Hero logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                    <span>No image available</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="break-all">{heroLogo.path || "Path not configured"}</p>
                {heroLogo.url && !heroLogo.pendingUpload && (
                  <a
                    href={heroLogo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View current image
                  </a>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase">
                  Repository Path
                </Label>
                <Input
                  value={heroLogoPathInput}
                  onChange={(event) => setHeroLogoPathInput(event.target.value)}
                  onBlur={() => {
                    const normalized = normalizeRepoPathInput(
                      heroLogoPathInput,
                      heroLogoPath || "public/assets/images/brand/hero-logo.svg"
                    )
                    setHeroLogoPath(normalized)
                    setHeroLogoPathInput(normalized)
                  }}
                  placeholder="public/assets/images/brand/hero-logo.svg"
                />
                <p className="text-xs text-muted-foreground">
                  Stored relative to <code>public/</code> in your repo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  id="hero-logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    if (file) {
                      void handleHeroLogoUpload(file)
                    }
                    event.target.value = ""
                  }}
                />
                <Button
                  type="button"
                  asChild
                  className="bg-transparent text-muted-foreground hover:bg-muted"
                >
                  <label
                    htmlFor="hero-logo-upload"
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {heroLogo.pendingUpload ? "Replace image" : "Upload image"}
                  </label>
                </Button>
                {heroLogo.pendingUpload && (
                  <Button
                    type="button"
                    className="bg-transparent text-muted-foreground hover:bg-muted"
                    onClick={clearPendingHeroLogo}
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Remove upload
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hero Logo Heights</CardTitle>
              <CardDescription>
                Adjust the height of the logo displayed in the hero section on the home page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="hero-logo-mobile">Mobile</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        id="hero-logo-mobile"
                        type="number"
                        value={heroLogoHeights.mobile}
                        onChange={(e) =>
                          setHeroLogoHeights((prev) => ({
                            ...prev,
                            mobile: e.target.value,
                          }))
                        }
                        placeholder="25"
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero-logo-tablet">Tablet</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        id="hero-logo-tablet"
                        type="number"
                        value={heroLogoHeights.tablet}
                        onChange={(e) =>
                          setHeroLogoHeights((prev) => ({
                            ...prev,
                            tablet: e.target.value,
                          }))
                        }
                        placeholder="28"
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero-logo-desktop">Desktop</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        id="hero-logo-desktop"
                        type="number"
                        value={heroLogoHeights.desktop}
                        onChange={(e) =>
                          setHeroLogoHeights((prev) => ({
                            ...prev,
                            desktop: e.target.value,
                          }))
                        }
                        placeholder="82"
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Layout Heights</CardTitle>
                  <CardDescription>
                    Adjust heights for different screen sizes and pages
                  </CardDescription>
                </div>
                <Select value={selectedPage} onValueChange={(value) => setSelectedPage(value as PageKey)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/">Home</SelectItem>
                    <SelectItem value="/about">About</SelectItem>
                    <SelectItem value="/products">Products</SelectItem>
                    <SelectItem value="/contact">Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Table-like layout */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3 text-xs font-medium text-gray-700">Element</th>
                        <th className="text-center p-3 text-xs font-medium text-gray-700">Mobile</th>
                        <th className="text-center p-3 text-xs font-medium text-gray-700">Tablet</th>
                        <th className="text-center p-3 text-xs font-medium text-gray-700">Desktop</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {/* Navbar Height */}
                      <tr>
                        <td className="p-3 text-sm font-medium">Navbar Height</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={currentPageHeights.navbar.mobile}
                              onChange={(e) => {
                                setLogoHeights((prev) => ({
                                  ...prev,
                                  [selectedPage]: {
                                    ...prev[selectedPage],
                                    navbar: { ...prev[selectedPage].navbar, mobile: e.target.value },
                                  },
                                }))
                              }}
                              className="h-8 w-20 text-center"
                              placeholder="83"
                            />
                            <span className="text-xs text-muted-foreground">px</span>
                          </div>
                        </td>
                        <td className="p-3"></td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={currentPageHeights.navbar.desktop}
                              onChange={(e) => {
                                setLogoHeights((prev) => ({
                                  ...prev,
                                  [selectedPage]: {
                                    ...prev[selectedPage],
                                    navbar: { ...prev[selectedPage].navbar, desktop: e.target.value },
                                  },
                                }))
                              }}
                              className="h-8 w-20 text-center"
                              placeholder="68"
                            />
                            <span className="text-xs text-muted-foreground">px</span>
                          </div>
                        </td>
                      </tr>
                      {/* Navbar Logo */}
                      <tr>
                        <td className="p-3 text-sm font-medium">Navbar Logo</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={currentPageHeights.navbarLogo.mobile}
                              onChange={(e) => {
                                setLogoHeights((prev) => ({
                                  ...prev,
                                  [selectedPage]: {
                                    ...prev[selectedPage],
                                    navbarLogo: { ...prev[selectedPage].navbarLogo, mobile: e.target.value },
                                  },
                                }))
                              }}
                              className="h-8 w-20 text-center"
                              placeholder="24"
                            />
                            <span className="text-xs text-muted-foreground">px</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={currentPageHeights.navbarLogo.tablet}
                              onChange={(e) => {
                                setLogoHeights((prev) => ({
                                  ...prev,
                                  [selectedPage]: {
                                    ...prev[selectedPage],
                                    navbarLogo: { ...prev[selectedPage].navbarLogo, tablet: e.target.value },
                                  },
                                }))
                              }}
                              className="h-8 w-20 text-center"
                              placeholder="28"
                            />
                            <span className="text-xs text-muted-foreground">px</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={currentPageHeights.navbarLogo.desktop}
                              onChange={(e) => {
                                setLogoHeights((prev) => ({
                                  ...prev,
                                  [selectedPage]: {
                                    ...prev[selectedPage],
                                    navbarLogo: { ...prev[selectedPage].navbarLogo, desktop: e.target.value },
                                  },
                                }))
                              }}
                              className="h-8 w-20 text-center"
                              placeholder="28"
                            />
                            <span className="text-xs text-muted-foreground">px</span>
                          </div>
                        </td>
                      </tr>
                      {/* Footer Height */}
                      <tr>
                        <td className="p-3 text-sm font-medium">Footer Height</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={currentPageHeights.footer.mobile}
                              onChange={(e) => {
                                setLogoHeights((prev) => ({
                                  ...prev,
                                  [selectedPage]: {
                                    ...prev[selectedPage],
                                    footer: { ...prev[selectedPage].footer, mobile: e.target.value },
                                  },
                                }))
                              }}
                              className="h-8 w-20 text-center"
                              placeholder="64"
                            />
                            <span className="text-xs text-muted-foreground">px</span>
                          </div>
                        </td>
                        <td className="p-3"></td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={currentPageHeights.footer.desktop}
                              onChange={(e) => {
                                setLogoHeights((prev) => ({
                                  ...prev,
                                  [selectedPage]: {
                                    ...prev[selectedPage],
                                    footer: { ...prev[selectedPage].footer, desktop: e.target.value },
                                  },
                                }))
                              }}
                              className="h-8 w-20 text-center"
                              placeholder="72"
                            />
                            <span className="text-xs text-muted-foreground">px</span>
                          </div>
                        </td>
                      </tr>
                      {/* Footer Logo */}
                      <tr>
                        <td className="p-3 text-sm font-medium">Footer Logo</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={currentPageHeights.footerLogo.mobile}
                              onChange={(e) => {
                                setLogoHeights((prev) => ({
                                  ...prev,
                                  [selectedPage]: {
                                    ...prev[selectedPage],
                                    footerLogo: { ...prev[selectedPage].footerLogo, mobile: e.target.value },
                                  },
                                }))
                              }}
                              className="h-8 w-20 text-center"
                              placeholder="20"
                            />
                            <span className="text-xs text-muted-foreground">px</span>
                          </div>
                        </td>
                        <td className="p-3"></td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={currentPageHeights.footerLogo.desktop}
                              onChange={(e) => {
                                setLogoHeights((prev) => ({
                                  ...prev,
                                  [selectedPage]: {
                                    ...prev[selectedPage],
                                    footerLogo: { ...prev[selectedPage].footerLogo, desktop: e.target.value },
                                  },
                                }))
                              }}
                              className="h-8 w-20 text-center"
                              placeholder="32"
                            />
                            <span className="text-xs text-muted-foreground">px</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              className="bg-transparent text-muted-foreground hover:bg-muted"
              onClick={handleDiscardAll}
              disabled={saving || !hasPendingChanges}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Discard All
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasPendingChanges}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
