"use client"

import { useEffect } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Save,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { getPagesArray } from "@/lib/utils/pages-helpers"
import { PagesView } from "./pages-management/pages-view"
import { SectionsView } from "./pages-management/sections-view"
import { ComponentsView } from "./pages-management/components-view"
import { BrandSettingsView } from "./pages-management/brand-settings/brand-settings-view"

export function PagesManagementSection() {
  const {
    pagesData,
    sectionsData,
    isLoading,
    isSaving,
    error,
    feedback,
    currentView,
    hasPendingChanges,
    hasConflict,
    fetchData,
    saveAll,
    discardChanges,
    refreshAndRetry,
    clearError,
    clearFeedback,
    setView,
  } = usePagesStore()
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()

  useEffect(() => {
    if (repoOwnerFromLink && repoNameFromLink) {
      fetchData()
    }
  }, [repoOwnerFromLink, repoNameFromLink, fetchData])

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        clearFeedback()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [feedback, clearFeedback])

  const pages = pagesData ? getPagesArray(pagesData) : []

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b pb-4 pt-4 -mt-8 -mx-8 px-8 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Pages & Sections</h3>
            <p className="text-sm text-muted-foreground">
              Manage pages, sections, and component content for your website.
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
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {error && (
        <Card className={hasConflict ? "border-yellow-500 bg-yellow-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className={cn(
                "h-5 w-5",
                hasConflict ? "text-yellow-600" : "text-red-500"
              )} />
              {hasConflict ? "Conflict Detected" : "Error"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-sm mb-4",
              hasConflict ? "text-yellow-800" : "text-muted-foreground"
            )}>
              {error}
            </p>
            {hasConflict ? (
              <div className="space-y-2">
                <p className="text-xs text-yellow-700 mb-4">
                  The file was modified by someone else. Click "Refresh and Retry" to fetch the latest version and re-apply your changes.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={refreshAndRetry} 
                    variant="default" 
                    size="sm"
                    disabled={isSaving || isLoading}
                    className="gap-2"
                  >
                    {isSaving || isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh and Retry
                  </Button>
                  <Button 
                    onClick={discardChanges} 
                    variant="outline" 
                    size="sm"
                    disabled={isSaving || isLoading}
                  >
                    Discard My Changes
                  </Button>
                  <Button 
                    onClick={clearError} 
                    variant="ghost" 
                    size="sm"
                    disabled={isSaving || isLoading}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={fetchData} variant="outline" size="sm" disabled={isLoading}>
                  Retry
                </Button>
                <Button onClick={clearError} variant="ghost" size="sm">
                  Dismiss
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : pagesData && sectionsData ? (
        <>
          {currentView === "pages" && <PagesView pages={pages} />}
          {currentView === "sections" && <SectionsView />}
          {currentView === "components" && <ComponentsView />}
          {currentView === "brand-settings" && <BrandSettingsView />}
        </>
      ) : currentView === "brand-settings" ? (
        <BrandSettingsView />
      ) : null}
    </div>
  )
}

