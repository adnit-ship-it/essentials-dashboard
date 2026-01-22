"use client"

import { Loader2, RefreshCw, Save, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { LogoRegistryView } from "./logo-registry-view"
import { BrandColorsEditor } from "./brand-colors-editor"
import { FaviconManager } from "./favicon-manager"
import { LogoSizesEditorWrapper } from "./logo-sizes-editor-wrapper"
import { PageMetadataEditor } from "./page-metadata-editor"
import { getStaggeredAnimationStyle } from "@/lib/utils/animation"

export function BrandSettingsView() {
  const {
    hasPendingChanges,
    isSaving,
    isLoading,
    fetchData,
    saveAll,
    discardChanges,
  } = usePagesStore()
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const { pagesData } = usePagesStore()

  // Generate animation key based on pagesData to trigger animations on refresh
  const animationKey = pagesData ? JSON.stringify(pagesData).slice(0, 50) : "loading"

  const brandSettingComponents = [
    { Component: PageMetadataEditor, key: "page-metadata" },
    { Component: BrandColorsEditor, key: "brand-colors" },
    { Component: LogoRegistryView, key: "logo-registry" },
    { Component: LogoSizesEditorWrapper, key: "logo-sizes" },
    { Component: FaviconManager, key: "favicon" },
  ]

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background border-b pb-4 pt-2 -mx-8 px-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Brand Settings</h3>
            <p className="text-sm text-muted-foreground">
              Manage brand colors, logos, and design assets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasPendingChanges && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={discardChanges}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <Undo2 className="h-4 w-4" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={saveAll}
                  disabled={isSaving || !hasPendingChanges}
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading || isSaving || !repoOwnerFromLink || !repoNameFromLink}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div key={animationKey}>
        {brandSettingComponents.map(({ Component, key }, index) => (
          <div
            key={key}
            className="animate-fade-in-staggered pb-2 last:pb-0"
            style={getStaggeredAnimationStyle(index)}
          >
            <Component />
          </div>
        ))}
      </div>
    </div>
  )
}

