"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useRepoAppDataStore } from "@/lib/stores/repo-app-data-store"
import { LogoSizesEditor } from "@/components/pages/sections/brand-settings/logo-sizes-editor"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LogoSize } from "@/lib/types/branding"
// Helper to convert from common.json logoSizes to editor format
function convertLogoSizes(commonData: any): {
  navbar: LogoSize
  footer: LogoSize
  loadingScreen: LogoSize
} {
  const logoSizes = commonData?.logoSizes || {}
  
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
  }
}

interface LogoSizesEditorWrapperProps {
  isOpen?: boolean
  onToggle?: () => void
  hideCard?: boolean
}

export function LogoSizesEditorWrapper({ isOpen: controlledIsOpen, onToggle, hideCard = false }: LogoSizesEditorWrapperProps = {}) {
  const { commonData, updateCommonData } = usePagesStore()
  const hostTemplateInfo = useRepoAppDataStore((s) => s.hostTemplateInfo)
  const [localIsOpen, setLocalIsOpen] = useState(false)
  
  // Use controlled state if provided, otherwise use local state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : localIsOpen
  const handleToggle = onToggle || (() => setLocalIsOpen(!localIsOpen))

  if (!commonData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading logo sizes...</p>
        </CardContent>
      </Card>
    )
  }

  const logoSizes = convertLogoSizes(commonData)

  const handleLogoSizesChange = (newLogoSizes: typeof logoSizes) => {
    updateCommonData((data) => ({
      ...data,
      logoSizes: newLogoSizes,
    }))
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
      templateName={hostTemplateInfo?.templateName ?? null}
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

