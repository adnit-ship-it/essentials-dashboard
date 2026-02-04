"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Layout } from "lucide-react"
import type { LogoSize } from "@/lib/types/branding"
import { getLogoPreviewImagePath } from "@/lib/utils/section-preview-images"

interface LogoSizeEditorProps {
  label: string
  description: string
  size: LogoSize
  onSizeChange: (size: LogoSize) => void
  logoType?: "navbar" | "footer" | "loadingScreen" | "hero" | "contact" | "products"
  templateName?: string | null
}

// Helper to strip "px" from value for display
function stripPx(value: string): string {
  if (!value) return ""
  return value.replace(/px$/i, "").trim()
}

// Helper to add "px" to value
function addPx(value: string): string {
  if (!value || value === "auto") return value
  const numValue = value.replace(/px$/i, "").trim()
  if (!numValue) return ""
  return `${numValue}px`
}

export function LogoSizeEditor({ label, description, size, onSizeChange, logoType, templateName }: LogoSizeEditorProps) {
  const [imageError, setImageError] = useState(false)
  
  const previewImagePath = logoType && templateName 
    ? getLogoPreviewImagePath(logoType, templateName)
    : null

  const handleHeightChange = (breakpoint: "mobile" | "tablet" | "desktop", value: string) => {
    onSizeChange({
      ...size,
      height: {
        ...size.height,
        [breakpoint]: addPx(value),
      },
    })
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      {/* Preview Image Area */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {previewImagePath && !imageError ? (
          <img
            src={previewImagePath}
            alt={`${label} preview`}
            className="w-full h-full object-cover"
            onError={() => {
              setImageError(true)
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Layout className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Card Content */}
      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Title and Description */}
        <div className="mb-3">
          <h3 className="font-medium text-sm">{label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>

        {/* Heights */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Heights</Label>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor={`${label}-height-mobile`} className="text-xs text-muted-foreground">Mobile</Label>
              <div className="flex items-center gap-1">
                <Input
                  id={`${label}-height-mobile`}
                  type="number"
                  value={stripPx(size.height.mobile || "")}
                  onChange={(e) => handleHeightChange("mobile", e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value) {
                      handleHeightChange("mobile", e.target.value)
                    }
                  }}
                  placeholder="24"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor={`${label}-height-tablet`} className="text-xs text-muted-foreground">Tablet</Label>
              <div className="flex items-center gap-1">
                <Input
                  id={`${label}-height-tablet`}
                  type="number"
                  value={stripPx(size.height.tablet || "")}
                  onChange={(e) => handleHeightChange("tablet", e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value) {
                      handleHeightChange("tablet", e.target.value)
                    }
                  }}
                  placeholder="28"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor={`${label}-height-desktop`} className="text-xs text-muted-foreground">Desktop</Label>
              <div className="flex items-center gap-1">
                <Input
                  id={`${label}-height-desktop`}
                  type="number"
                  value={stripPx(size.height.desktop || "")}
                  onChange={(e) => handleHeightChange("desktop", e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value) {
                      handleHeightChange("desktop", e.target.value)
                    }
                  }}
                  placeholder="28"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-right">px</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface LogoSizesEditorProps {
  logoSizes: {
    navbar: LogoSize
    footer: LogoSize
    loadingScreen: LogoSize
    hero: LogoSize
    contact: LogoSize
    products: LogoSize
  }
  onLogoSizesChange: (logoSizes: LogoSizesEditorProps["logoSizes"]) => void
  hideHeader?: boolean
  templateName?: string | null
}

export function LogoSizesEditor({ logoSizes, onLogoSizesChange, hideHeader = false, templateName = null }: LogoSizesEditorProps) {
  const updateSize = (key: keyof typeof logoSizes, size: LogoSize) => {
    onLogoSizesChange({
      ...logoSizes,
      [key]: size,
    })
  }

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div>
          <h3 className="text-sm font-medium mb-2">Logo Sizes</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Configure heights for logos in different contexts.
          </p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LogoSizeEditor
          label="Navbar Logo"
          description="Logo in navigation bar"
          size={logoSizes.navbar}
          onSizeChange={(size) => updateSize("navbar", size)}
          logoType="navbar"
          templateName={templateName}
        />
        <LogoSizeEditor
          label="Footer Logo"
          description="Logo in footer"
          size={logoSizes.footer}
          onSizeChange={(size) => updateSize("footer", size)}
          logoType="footer"
          templateName={templateName}
        />
        <LogoSizeEditor
          label="Loading Screen"
          description="Logo on loading screen"
          size={logoSizes.loadingScreen}
          onSizeChange={(size) => updateSize("loadingScreen", size)}
          logoType="loadingScreen"
          templateName={templateName}
        />
        <LogoSizeEditor
          label="Hero Logo"
          description="Logo in hero section"
          size={logoSizes.hero}
          onSizeChange={(size) => updateSize("hero", size)}
          logoType="hero"
          templateName={templateName}
        />
        <LogoSizeEditor
          label="Contact Logo"
          description="Logo on contact page"
          size={logoSizes.contact}
          onSizeChange={(size) => updateSize("contact", size)}
          logoType="contact"
          templateName={templateName}
        />
        <LogoSizeEditor
          label="Products Logo"
          description="Logo on products page"
          size={logoSizes.products}
          onSizeChange={(size) => updateSize("products", size)}
          logoType="products"
          templateName={templateName}
        />
      </div>
    </div>
  )
}
