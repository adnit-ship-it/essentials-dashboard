"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { usePagesStore } from "@/lib/stores/pages-store"
import { LogoSizesEditor } from "@/components/pages/sections/brand-settings/logo-sizes-editor"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LogoSize } from "@/lib/types/branding"
import type { PagesData } from "@/lib/types/pages"

// Helper to convert from pages.json format to editor format
function convertLogoSizes(pagesData: any): {
  navbar: LogoSize
  footer: LogoSize
  loadingScreen: LogoSize
  hero: LogoSize
  contact: LogoSize
  products: LogoSize
} {
  const logoSizes = pagesData?.logoSizes || {}
  
  return {
    navbar: logoSizes.navbar || {
      height: { mobile: "", tablet: "", desktop: "" },
      width: { mobile: "auto", tablet: "auto", desktop: "auto" },
    },
    footer: logoSizes.footer || {
      height: { mobile: "", tablet: "", desktop: "" },
      width: { mobile: "auto", tablet: "auto", desktop: "auto" },
    },
    loadingScreen: logoSizes.loadingScreen || {
      height: { mobile: "", desktop: "" },
      width: { mobile: "auto", desktop: "auto" },
    },
    hero: logoSizes.hero || {
      height: { mobile: "", tablet: "", desktop: "" },
      width: { mobile: "auto", desktop: "auto" },
    },
    contact: logoSizes.contact || {
      height: { mobile: "", tablet: "", desktop: "" },
      width: { mobile: "auto", tablet: "auto", desktop: "auto" },
    },
    products: logoSizes.products || {
      height: { mobile: "", tablet: "", desktop: "" },
      width: { mobile: "auto", tablet: "auto", desktop: "auto" },
    },
  }
}

export function LogoSizesEditorWrapper() {
  const { pagesData, updatePagesData } = usePagesStore()
  const [isOpen, setIsOpen] = useState(false)

  if (!pagesData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading logo sizes...</p>
        </CardContent>
      </Card>
    )
  }

  const logoSizes = convertLogoSizes(pagesData)

  const handleLogoSizesChange = (newLogoSizes: typeof logoSizes) => {
    updatePagesData(((data: PagesData) => {
      const updated = { ...data } as any
      updated.logoSizes = newLogoSizes
      return updated as PagesData
    }) as any)
  }

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Logo Sizes</CardTitle>
            <CardDescription>
              Configure heights and widths for logos in different contexts.
            </CardDescription>
          </div>
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="p-6">
          <LogoSizesEditor logoSizes={logoSizes} onLogoSizesChange={handleLogoSizesChange} hideHeader={true} />
        </CardContent>
      )}
    </Card>
  )
}

