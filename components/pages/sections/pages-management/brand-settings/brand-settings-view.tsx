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
import { LoadingScreenEditor } from "./loading-screen-editor"
import { PageMetadataEditor } from "./page-metadata-editor"

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

  return (
    <div className="space-y-6">
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

      <PageMetadataEditor />
      <BrandColorsEditor />
      <LogoRegistryView />
      <LogoSizesEditorWrapper />
      <LoadingScreenEditor />
      <FaviconManager />
    </div>
  )
}

