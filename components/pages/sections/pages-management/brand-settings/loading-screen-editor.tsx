"use client"

import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { LogoSelector } from "../component-editors/shared/logo-selector"
import { LogoSizeEditor } from "@/components/pages/sections/brand-settings/logo-sizes-editor"
import type { LogoSize } from "@/lib/types/branding"

// Convert relative path to GitHub raw URL for preview
function getLogoPreviewUrl(path: string, repoOwner?: string, repoName?: string): string {
  if (!path) return ""
  
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  
  if (repoOwner && repoName) {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path
    const repoPath = cleanPath.startsWith("public/") ? cleanPath : `public/${cleanPath}`
    return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${repoPath}`
  }
  
  return path
}

export function LoadingScreenEditor() {
  const { pagesData, updatePagesData } = usePagesStore()
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()

  if (!pagesData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  const loadingScreen = (pagesData as any).loadingScreen || { logo: { src: "", alt: "" }, text: "Loading..." }
  const logoSizes = (pagesData as any).logoSizes || {} as Record<string, LogoSize>
  const loadingScreenLogoSizes: LogoSize = logoSizes.loadingScreen || {
    height: { mobile: "", desktop: "" },
    width: { mobile: "auto", desktop: "auto" },
  }

  const logoUrl = loadingScreen.logo?.src
    ? getLogoPreviewUrl(loadingScreen.logo.src, repoOwnerFromLink ?? undefined, repoNameFromLink ?? undefined)
    : ""

  const handleLogoChange = (path: string) => {
    updatePagesData((data) => {
      return {
        ...data,
        loadingScreen: {
          ...loadingScreen,
          logo: {
            ...loadingScreen.logo,
            src: path,
          },
        },
      }
    })
  }

  const handleAltChange = (alt: string) => {
    updatePagesData((data) => {
      return {
        ...data,
        loadingScreen: {
          ...loadingScreen,
          logo: {
            ...loadingScreen.logo,
            alt,
          },
        },
      }
    })
  }

  const handleTextChange = (text: string) => {
    updatePagesData((data) => {
      return {
        ...data,
        loadingScreen: {
          ...loadingScreen,
          text,
        },
      }
    })
  }

  const handleLogoSizesChange = (newSizes: LogoSize) => {
    updatePagesData((data) => {
      return {
        ...data,
        logoSizes: {
          ...logoSizes,
          loadingScreen: newSizes,
        },
      }
    })
  }

  return (
    <CardContent className="space-y-6">
        {/* Logo Selection with Alt Text and Loading Text on same row */}
        <div className="space-y-4">
          <Label>Logo</Label>
          <div className="flex items-start gap-4">
            {logoUrl ? (
              <div className="flex-shrink-0">
                <div className="h-20 w-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                  <img
                    src={logoUrl}
                    alt={loadingScreen.logo?.alt || "Loading screen logo"}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex flex-col items-center justify-center text-xs text-muted-foreground p-2">
                            <svg class="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Not found</span>
                          </div>
                        `
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 h-20 w-24 bg-muted rounded-lg flex items-center justify-center border border-dashed">
                <span className="text-xs text-muted-foreground">No logo</span>
              </div>
            )}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <LogoSelector
                  label="Select from Registry"
                  value={loadingScreen.logo?.src || ""}
                  onChange={handleLogoChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Alt Text</Label>
                <Input
                  value={loadingScreen.logo?.alt || ""}
                  onChange={(e) => handleAltChange(e.target.value)}
                  placeholder="Loading screen logo"
                />
              </div>
              <div className="space-y-2">
                <Label>Loading Text</Label>
                <Input
                  value={loadingScreen.text || "Loading..."}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Loading..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logo Sizes - More Compact */}
        <div className="space-y-4">
          <Label>Logo Sizes</Label>
          <div className="max-w-2xl">
            <LogoSizeEditor
              label="Loading Screen Logo"
              description="Size of logo on loading screen"
              size={loadingScreenLogoSizes}
              onSizeChange={handleLogoSizesChange}
            />
          </div>
        </div>
    </CardContent>
  )
}

