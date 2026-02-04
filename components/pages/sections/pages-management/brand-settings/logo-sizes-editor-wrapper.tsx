"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
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
      height: { mobile: "", tablet: "", desktop: "" },
      width: { mobile: "auto", tablet: "auto", desktop: "auto" },
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

interface LogoSizesEditorWrapperProps {
  isOpen?: boolean
  onToggle?: () => void
  hideCard?: boolean
}

export function LogoSizesEditorWrapper({ isOpen: controlledIsOpen, onToggle, hideCard = false }: LogoSizesEditorWrapperProps = {}) {
  const { pagesData, updatePagesData } = usePagesStore()
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [localIsOpen, setLocalIsOpen] = useState(false)
  const [templateName, setTemplateName] = useState<string | null>(null)
  
  // Use controlled state if provided, otherwise use local state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : localIsOpen
  const handleToggle = onToggle || (() => setLocalIsOpen(!localIsOpen))

  // Fetch template name from hostTemplate.json
  useEffect(() => {
    if (repoOwnerFromLink && repoNameFromLink) {
      // Use relative URL in browser (same origin, no CORS), or configured URL on server
      const apiUrl = typeof window !== "undefined" 
        ? "" // Relative URL in browser
        : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
      const url = `${apiUrl}/api/host-template?owner=${encodeURIComponent(repoOwnerFromLink)}&repo=${encodeURIComponent(repoNameFromLink)}`
      
      fetch(url)
        .then((res) => {
          if (res.ok) {
            return res.json()
          }
          if (res.status === 404) {
            return null // File doesn't exist yet
          }
          throw new Error(`Failed to fetch host template: ${res.status}`)
        })
        .then((data) => {
          if (data?.templateName) {
            setTemplateName(data.templateName)
          } else {
            setTemplateName(null)
          }
        })
        .catch((error) => {
          console.error("Error fetching host template:", error)
          setTemplateName(null)
        })
    }
  }, [repoOwnerFromLink, repoNameFromLink])

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on input fields or buttons
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest("input")
    ) {
      return
    }
    handleToggle()
  }

  const content = (
    <LogoSizesEditor 
      logoSizes={logoSizes} 
      onLogoSizesChange={handleLogoSizesChange} 
      hideHeader={true}
      templateName={templateName}
    />
  )

  if (hideCard) {
    return content
  }

  return (
    <Card 
      className="cursor-pointer hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] transition-all duration-200"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Logo Sizes</CardTitle>
            <CardDescription>
              Configure heights for logos in different contexts.
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
        <CardContent className="p-6" onClick={(e) => e.stopPropagation()}>
          {content}
        </CardContent>
      )}
    </Card>
  )
}

