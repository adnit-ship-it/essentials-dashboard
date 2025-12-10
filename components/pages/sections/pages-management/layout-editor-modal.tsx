"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { LogoSelector } from "./component-editors/shared/logo-selector"
import type { PageKey } from "@/lib/types/pages"
import { isValidHeight, formatHeight } from "@/lib/utils/validation"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface LayoutEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pageKey: PageKey
}

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

// Height input with increment/decrement buttons
function HeightInput({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  error?: string
}) {
  const parseValue = (val: string): number => {
    const num = parseInt(val.replace("px", "").trim())
    return isNaN(num) ? 0 : num
  }

  const formatValue = (num: number): string => {
    return `${num}px`
  }

  const handleIncrement = () => {
    const current = parseValue(value || "0px")
    onChange(formatValue(current + 1))
  }

  const handleDecrement = () => {
    const current = parseValue(value || "0px")
    if (current > 0) {
      onChange(formatValue(current - 1))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Allow empty input while typing
    if (inputValue === "") {
      onChange("")
      return
    }
    // Validate and format
    if (isValidHeight(inputValue)) {
      onChange(formatHeight(inputValue))
    } else {
      onChange(inputValue) // Allow typing, validation happens on blur
    }
  }

  const handleBlur = () => {
    if (value && !isValidHeight(value)) {
      // Try to fix common issues
      const num = parseValue(value)
      if (num > 0) {
        onChange(formatValue(num))
      }
    }
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleDecrement}
          disabled={parseValue(value || "0px") <= 0}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "text-center",
            error ? "border-red-500" : ""
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleIncrement}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export function LayoutEditorModal({
  open,
  onOpenChange,
  pageKey,
}: LayoutEditorModalProps) {
  const { pagesData, updatePagesData } = usePagesStore()
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  if (!pagesData) return null

  const page = pagesData[pageKey] as any
  if (!page) return null

  const validateAndUpdate = (field: string, value: string, updateFn: (val: string) => void) => {
    if (field.includes("height") || field.includes("size")) {
      if (!isValidHeight(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          [field]: "Height must be a number followed by 'px' (e.g., 83px)",
        }))
        return
      }
      const formatted = formatHeight(value)
      updateFn(formatted)
      setValidationErrors((prev) => {
        const { [field]: _, ...rest } = prev
        return rest
      })
    } else {
      updateFn(value)
    }
  }

  const navbar = page.navbar || {
    heights: { mobile: "", tablet: "", desktop: "" },
    logo: { src: "", alt: "" },
  }

  const footer = page.footer || {
    heights: { mobile: "", tablet: "", desktop: "" },
    logo: { src: "", alt: "" },
  }

  const navbarLogoUrl = navbar.logo?.src
    ? getLogoPreviewUrl(navbar.logo.src, repoOwnerFromLink ?? undefined, repoNameFromLink ?? undefined)
    : ""

  const footerLogoUrl = footer.logo?.src
    ? getLogoPreviewUrl(footer.logo.src, repoOwnerFromLink ?? undefined, repoNameFromLink ?? undefined)
    : ""

  const updateNavbar = (updates: any) => {
    updatePagesData((data) => {
      const updated = { ...data }
      const pageData = updated[pageKey] as any
      if (pageData) {
        updated[pageKey] = {
          ...pageData,
          navbar: { ...navbar, ...updates },
        }
      }
      return updated
    })
  }

  const updateFooter = (updates: any) => {
    updatePagesData((data) => {
      const updated = { ...data }
      const pageData = updated[pageKey] as any
      if (pageData) {
        updated[pageKey] = {
          ...pageData,
          footer: { ...footer, ...updates },
        }
      }
      return updated
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Layout: {page.title}</DialogTitle>
          <DialogDescription>
            Configure navbar and footer settings for this page.
          </DialogDescription>
        </DialogHeader>

        {Object.keys(validationErrors).length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {Object.values(validationErrors)[0]}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 mt-4">
          {/* Navbar Section */}
          <div className="space-y-4 border rounded-lg p-6 bg-card">
            <h3 className="font-semibold text-lg">Navbar</h3>

            {/* Logo Preview and Selector */}
            <div className="space-y-3">
              <Label>Logo</Label>
              <div className="flex items-start gap-4">
                {navbarLogoUrl ? (
                  <div className="flex-shrink-0">
                    <div className="h-24 w-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                      <img
                        src={navbarLogoUrl}
                        alt={navbar.logo?.alt || "Navbar logo"}
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
                  <div className="flex-shrink-0 h-24 w-32 bg-muted rounded-lg flex items-center justify-center border border-dashed">
                    <span className="text-xs text-muted-foreground">No logo</span>
                  </div>
                )}
                <div className="flex-1">
                  <LogoSelector
                    label=""
                    value={navbar.logo?.src || ""}
                    onChange={(path) =>
                      updateNavbar({
                        logo: { ...navbar.logo, src: path },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Heights</Label>
              <div className="grid grid-cols-3 gap-4">
                <HeightInput
                  label="Mobile"
                  value={navbar.heights?.mobile || ""}
                  onChange={(val) =>
                    updateNavbar({
                      heights: { ...navbar.heights, mobile: val },
                    })
                  }
                  placeholder="83px"
                  error={validationErrors["navbar-height-mobile"]}
                />
                <HeightInput
                  label="Tablet"
                  value={navbar.heights?.tablet || ""}
                  onChange={(val) =>
                    updateNavbar({
                      heights: { ...navbar.heights, tablet: val },
                    })
                  }
                  placeholder="68px"
                  error={validationErrors["navbar-height-tablet"]}
                />
                <HeightInput
                  label="Desktop"
                  value={navbar.heights?.desktop || ""}
                  onChange={(val) =>
                    updateNavbar({
                      heights: { ...navbar.heights, desktop: val },
                    })
                  }
                  placeholder="68px"
                  error={validationErrors["navbar-height-desktop"]}
                />
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="space-y-4 border rounded-lg p-6 bg-card">
            <h3 className="font-semibold text-lg">Footer</h3>

            {/* Logo Preview and Selector */}
            <div className="space-y-3">
              <Label>Logo</Label>
              <div className="flex items-start gap-4">
                {footerLogoUrl ? (
                  <div className="flex-shrink-0">
                    <div className="h-24 w-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                      <img
                        src={footerLogoUrl}
                        alt={footer.logo?.alt || "Footer logo"}
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
                  <div className="flex-shrink-0 h-24 w-32 bg-muted rounded-lg flex items-center justify-center border border-dashed">
                    <span className="text-xs text-muted-foreground">No logo</span>
                  </div>
                )}
                <div className="flex-1">
                  <LogoSelector
                    label=""
                    value={footer.logo?.src || ""}
                    onChange={(path) =>
                      updateFooter({
                        logo: { ...footer.logo, src: path },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Heights</Label>
              <div className="grid grid-cols-3 gap-4">
                <HeightInput
                  label="Mobile"
                  value={footer.heights?.mobile || ""}
                  onChange={(val) =>
                    updateFooter({
                      heights: { ...footer.heights, mobile: val },
                    })
                  }
                  placeholder="64px"
                  error={validationErrors["footer-height-mobile"]}
                />
                <HeightInput
                  label="Tablet"
                  value={footer.heights?.tablet || ""}
                  onChange={(val) =>
                    updateFooter({
                      heights: { ...footer.heights, tablet: val },
                    })
                  }
                  placeholder="72px"
                  error={validationErrors["footer-height-tablet"]}
                />
                <HeightInput
                  label="Desktop"
                  value={footer.heights?.desktop || ""}
                  onChange={(val) =>
                    updateFooter({
                      heights: { ...footer.heights, desktop: val },
                    })
                  }
                  placeholder="72px"
                  error={validationErrors["footer-height-desktop"]}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
