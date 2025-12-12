"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw, Save, Undo2, CheckCircle2, AlertTriangle, ChevronDown, X } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function BrandSettingsView() {
  const {
    hasPendingChanges,
    isSaving,
    isLoading,
    feedback,
    fetchData,
    saveAll,
    discardChanges,
    clearFeedback,
  } = usePagesStore()
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metadata: true,
    colors: true,
    logoRegistry: true,
    logoSizes: false,
    loadingScreen: false,
    favicon: false,
  })

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        clearFeedback()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [feedback, clearFeedback])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b pb-4 pt-4 -mt-8 -mx-8 px-8 mb-4">
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

        {feedback && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border p-3 text-sm mt-4",
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            )}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span className="flex-1">{feedback.message}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={clearFeedback}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Collapsible Sections */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection("metadata")}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Page Metadata</CardTitle>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSections.metadata ? "rotate-180" : ""
              )}
            />
          </div>
        </CardHeader>
        {expandedSections.metadata && (
          <CardContent>
            <PageMetadataEditor />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection("colors")}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Brand Colors</CardTitle>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSections.colors ? "rotate-180" : ""
              )}
            />
          </div>
        </CardHeader>
        {expandedSections.colors && (
          <CardContent>
            <BrandColorsEditor />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection("logoRegistry")}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Logo Registry</CardTitle>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSections.logoRegistry ? "rotate-180" : ""
              )}
            />
          </div>
        </CardHeader>
        {expandedSections.logoRegistry && (
          <CardContent>
            <LogoRegistryView />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection("logoSizes")}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Logo Sizes</CardTitle>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSections.logoSizes ? "rotate-180" : ""
              )}
            />
          </div>
        </CardHeader>
        {expandedSections.logoSizes && (
          <div>
            <LogoSizesEditorWrapper />
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection("loadingScreen")}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Loading Screen</CardTitle>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSections.loadingScreen ? "rotate-180" : ""
              )}
            />
          </div>
        </CardHeader>
        {expandedSections.loadingScreen && (
          <CardContent>
            <LoadingScreenEditor />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection("favicon")}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Favicon</CardTitle>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedSections.favicon ? "rotate-180" : ""
              )}
            />
          </div>
        </CardHeader>
        {expandedSections.favicon && (
          <CardContent>
            <FaviconManager />
          </CardContent>
        )}
      </Card>
    </div>
  )
}

