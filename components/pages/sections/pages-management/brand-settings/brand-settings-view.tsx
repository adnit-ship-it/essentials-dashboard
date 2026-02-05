"use client"

import { useState } from "react"
import { Loader2, RefreshCw, Save, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { AnnouncementModal } from "./modals/announcement-modal"
import { AnnouncementPreview } from "./previews/announcement-preview"

const brandSettingDescriptions: Record<string, string> = {
  "announcement": "Site-wide announcement banner",
  "page-metadata": "Title and description for your site",
  "brand-colors": "Background, body, and accent colors",
  "logo-registry": "Primary, secondary, and loading logos",
  "logo-sizes": "Logo heights for different contexts",
  "favicon": "Browser tab icon",
}

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
      key: "announcement",
      title: "Announcement Bar",
      PreviewComponent: AnnouncementPreview,
      ModalComponent: AnnouncementModal,
    },
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

      <div className="flex flex-wrap gap-4">
        {brandSettingComponents.map(({ key, title, PreviewComponent, ModalComponent }) => (
          <div key={key} className="w-full md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
            <Card
              className={cn(
                "cursor-pointer hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] transition-all duration-200 overflow-hidden h-full flex flex-col"
              )}
              onClick={() => handleEdit(key)}
            >
              {/* Preview Area */}
              <div className="relative aspect-video bg-muted overflow-hidden flex items-center justify-center p-4">
                <PreviewComponent
                  onEdit={() => handleEdit(key)}
                  repoOwner={repoOwnerFromLink}
                  repoName={repoNameFromLink}
                />
              </div>

              {/* Card Content */}
              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {brandSettingDescriptions[key] || "Configure this setting"}
                  </p>
                </div>
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
