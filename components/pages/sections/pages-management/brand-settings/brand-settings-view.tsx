"use client"

import { useState } from "react"
import { Loader2, RefreshCw, Save, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { PageMetadataPreview } from "./previews/page-metadata-preview"
import { BrandColorsPreview } from "./previews/brand-colors-preview"
import { LogoRegistryPreview } from "./previews/logo-registry-preview"
import { LogoSizesPreview } from "./previews/logo-sizes-preview"
import { FaviconPreview } from "./previews/favicon-preview"
import { PageMetadataModal } from "./modals/page-metadata-modal"
import { BrandColorsModal } from "./modals/brand-colors-modal"
import { LogoRegistryModal } from "./modals/logo-registry-modal"
import { LogoSizesModal } from "./modals/logo-sizes-modal"
import { FaviconModal } from "./modals/favicon-modal"

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

  // Track which modal is currently open
  const [openModalKey, setOpenModalKey] = useState<string | null>(null)

  const brandSettingComponents = [
    {
      key: "page-metadata",
      title: "Page Metadata",
      PreviewComponent: PageMetadataPreview,
      ModalComponent: PageMetadataModal,
    },
    {
      key: "brand-colors",
      title: "Brand Colors",
      PreviewComponent: BrandColorsPreview,
      ModalComponent: BrandColorsModal,
    },
    {
      key: "logo-registry",
      title: "Logo Registry",
      PreviewComponent: LogoRegistryPreview,
      ModalComponent: LogoRegistryModal,
    },
    {
      key: "logo-sizes",
      title: "Logo Sizes",
      PreviewComponent: LogoSizesPreview,
      ModalComponent: LogoSizesModal,
    },
    {
      key: "favicon",
      title: "Favicon",
      PreviewComponent: FaviconPreview,
      ModalComponent: FaviconModal,
    },
  ]

  const handleEdit = (key: string) => {
    setOpenModalKey(key)
  }

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setOpenModalKey(null)
    }
  }

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

      <div className="flex flex-wrap gap-4 justify-center">
        {brandSettingComponents.map(({ key, title, PreviewComponent, ModalComponent }) => (
          <div key={key} className="w-full md:w-[350px] lg:w-[300px] aspect-square max-w-full">
            <Card
              className={cn(
                "cursor-pointer transition-all hover:shadow-md aspect-square",
                "flex flex-col h-full"
              )}
            >
              <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="text-sm capitalize line-clamp-1">
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center overflow-hidden p-4">
                <PreviewComponent
                  onEdit={() => handleEdit(key)}
                  repoOwner={repoOwnerFromLink}
                  repoName={repoNameFromLink}
                />
              </CardContent>
            </Card>
            {openModalKey === key && (
              <ModalComponent
                open={true}
                onOpenChange={handleModalClose}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

