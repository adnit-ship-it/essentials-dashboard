"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { LogoSize } from "@/lib/types/branding"

interface LogoSizeEditorProps {
  label: string
  description: string
  size: LogoSize
  onSizeChange: (size: LogoSize) => void
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

export function LogoSizeEditor({ label, description, size, onSizeChange }: LogoSizeEditorProps) {
  const [widthAuto, setWidthAuto] = useState<Record<string, boolean>>({
    mobile: size.width.mobile === "auto",
    desktop: size.width.desktop === "auto",
  })

  const handleWidthToggle = (breakpoint: "mobile" | "desktop", isAuto: boolean) => {
    setWidthAuto((prev) => ({ ...prev, [breakpoint]: isAuto }))
    onSizeChange({
      ...size,
      width: {
        ...size.width,
        [breakpoint]: isAuto ? "auto" : "",
      },
    })
  }

  const handleWidthChange = (breakpoint: "mobile" | "desktop", value: string) => {
    if (!widthAuto[breakpoint]) {
      onSizeChange({
        ...size,
        width: {
          ...size.width,
          [breakpoint]: addPx(value),
        },
      })
    }
  }

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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{label}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Heights */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Heights</Label>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor={`${label}-height-mobile`} className="text-xs">Mobile</Label>
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
                  className="h-8 w-20 text-sm"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            {size.height.tablet !== undefined && (
              <div className="space-y-1">
                <Label htmlFor={`${label}-height-tablet`} className="text-xs">Tablet</Label>
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
                    className="h-8 w-20 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor={`${label}-height-desktop`} className="text-xs">Desktop</Label>
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
                  className="h-8 w-20 text-sm"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Widths */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Widths</Label>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${label}-width-mobile`} className="text-xs">Mobile</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${label}-width-mobile-auto`} className="text-xs">Auto</Label>
                  <Switch
                    id={`${label}-width-mobile-auto`}
                    checked={widthAuto.mobile}
                    onCheckedChange={(checked) => handleWidthToggle("mobile", checked)}
                  />
                </div>
              </div>
              {!widthAuto.mobile && (
                <div className="flex items-center gap-1">
                  <Input
                    id={`${label}-width-mobile`}
                    type="number"
                    value={typeof size.width.mobile === "string" && size.width.mobile !== "auto" ? stripPx(size.width.mobile) : ""}
                    onChange={(e) => handleWidthChange("mobile", e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value) {
                        handleWidthChange("mobile", e.target.value)
                      }
                    }}
                    placeholder="192"
                    className="h-8 w-20 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${label}-width-desktop`} className="text-xs">Desktop</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${label}-width-desktop-auto`} className="text-xs">Auto</Label>
                  <Switch
                    id={`${label}-width-desktop-auto`}
                    checked={widthAuto.desktop}
                    onCheckedChange={(checked) => handleWidthToggle("desktop", checked)}
                  />
                </div>
              </div>
              {!widthAuto.desktop && (
                <div className="flex items-center gap-1">
                  <Input
                    id={`${label}-width-desktop`}
                    type="number"
                    value={typeof size.width.desktop === "string" && size.width.desktop !== "auto" ? stripPx(size.width.desktop) : ""}
                    onChange={(e) => handleWidthChange("desktop", e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value) {
                        handleWidthChange("desktop", e.target.value)
                      }
                    }}
                    placeholder="365"
                    className="h-8 w-20 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              )}
            </div>
          </div>
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
}

export function LogoSizesEditor({ logoSizes, onLogoSizesChange }: LogoSizesEditorProps) {
  const updateSize = (key: keyof typeof logoSizes, size: LogoSize) => {
    onLogoSizesChange({
      ...logoSizes,
      [key]: size,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Logo Sizes</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Configure heights and widths for logos in different contexts.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LogoSizeEditor
          label="Navbar Logo"
          description="Logo in navigation bar"
          size={logoSizes.navbar}
          onSizeChange={(size) => updateSize("navbar", size)}
        />
        <LogoSizeEditor
          label="Footer Logo"
          description="Logo in footer"
          size={logoSizes.footer}
          onSizeChange={(size) => updateSize("footer", size)}
        />
        <LogoSizeEditor
          label="Loading Screen"
          description="Logo on loading screen"
          size={logoSizes.loadingScreen}
          onSizeChange={(size) => updateSize("loadingScreen", size)}
        />
        <LogoSizeEditor
          label="Hero Logo"
          description="Logo in hero section"
          size={logoSizes.hero}
          onSizeChange={(size) => updateSize("hero", size)}
        />
        <LogoSizeEditor
          label="Contact Logo"
          description="Logo on contact page"
          size={logoSizes.contact}
          onSizeChange={(size) => updateSize("contact", size)}
        />
        <LogoSizeEditor
          label="Products Logo"
          description="Logo on products page"
          size={logoSizes.products}
          onSizeChange={(size) => updateSize("products", size)}
        />
      </div>
    </div>
  )
}




