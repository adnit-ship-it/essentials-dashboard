"use client"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, AlertTriangle, ChevronLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { ProductsSection, ReviewsSection, PagesManagementSection } from "@/components/pages"
import { OverviewSection } from "@/components/pages/sections/overview-section"
import { BrandSettingsView } from "@/components/pages/sections/pages-management/brand-settings/brand-settings-view"
import { RepositorySetupModal, RepositoryCreateModal } from "@/components/features/repository"
import { Sidebar } from "./sidebar"
import { EmptyStateView } from "./empty-state-view"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useRepositoryStore } from "@/lib/stores/repository-store"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useRepoAppDataStore } from "@/lib/stores/repo-app-data-store"
import { useBrandColorsStore } from "@/lib/stores/brand-colors-store"
import { toast } from "sonner"

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("overview")
  const [showRepoModal, setShowRepoModal] = useState(false)
  const [showCreateRepoModal, setShowCreateRepoModal] = useState(false)
  const [show404Alert, setShow404Alert] = useState(false)
  
  const { 
    fetchAvailableRepos, 
    selectedRepoId, 
    configuredRepos, 
    ensureRepoConfigured 
  } = useRepositoryStore()
  
  const { 
    organizations, 
    fetchOrganizations, 
    isLoading: isLoadingOrgs, 
    hasFetched: hasFetchedOrgs, 
    selectedOrgId, 
    repoOwnerFromLink, 
    repoNameFromLink,
    repoValidationError,
    isValidatingRepo,
    validateRepositoryExists
  } = useOrganizationStore()

  const { currentView, goBack } = usePagesStore()

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  // When an organization is selected and has a linked repo, ensure it's configured and selected
  useEffect(() => {
    if (selectedOrgId && repoOwnerFromLink && repoNameFromLink && !repoValidationError) {
      ensureRepoConfigured(repoOwnerFromLink, repoNameFromLink).catch((error) => {
        console.error("Error ensuring repo is configured:", error)
      })
    }
  }, [selectedOrgId, repoOwnerFromLink, repoNameFromLink, repoValidationError, ensureRepoConfigured])

  const handleBack = () => {
    if (activeSection === "pages" && currentView !== "pages") {
      goBack()
    } else {
      setActiveSection("overview")
    }
  }

  const getCurrentSectionTitle = () => {
    const sections = [
      { id: "overview", title: "Overview" },
      { id: "pages", title: "Pages & Sections" },
      { id: "products", title: "Products" },
      { id: "brand-settings", title: "Brand Settings" },
    ]
    return sections.find((section) => section.id === activeSection)?.title || "Dashboard"
  }

  // Determine if we should show the empty state
  const showEmptyState = useMemo(() => {
    if (selectedOrgId) {
      const hasLinkedRepo = !!(repoOwnerFromLink && repoNameFromLink)
      // Show empty state if no repo linked OR if repo validation failed
      return !hasLinkedRepo || !!repoValidationError
    }
    return !selectedRepoId && configuredRepos.length === 0
  }, [selectedOrgId, repoOwnerFromLink, repoNameFromLink, repoValidationError, selectedRepoId, configuredRepos])

  // Centralized data fetch: load template data as soon as we have a valid repo
  useEffect(() => {
    useBrandColorsStore.getState().clearIfRepoChanged()
    if (repoOwnerFromLink && repoNameFromLink && !showEmptyState) {
      usePagesStore.getState().fetchData()
      useRepoAppDataStore.getState().fetchRepoAppData()
    }
  }, [repoOwnerFromLink, repoNameFromLink, showEmptyState])

  const handleRepositoryCreated = async (owner: string | null, repo: string | null, isNewlyCreated?: boolean) => {
    setShowCreateRepoModal(false)
    fetchAvailableRepos()

    if (owner && repo && selectedOrgId) {
      const { updatePartnerIntegrationBillOfRights } = useOrganizationStore.getState()
      try {
        await updatePartnerIntegrationBillOfRights({
          repoOwner: owner,
          repoName: repo,
          linkName: undefined,
        })
        // Validate the new repository (updatePartnerIntegrationBillOfRights already validates, but ensure it's done)
        if (validateRepositoryExists) {
          await validateRepositoryExists(owner, repo)
        }
        // Ensure repo config is created with logo paths derived from media.json
        await ensureRepoConfigured(owner, repo)
        toast.success(`Repository '${repo}' linked to organization successfully!`)
      } catch (error) {
        console.error("Error linking repository:", error)
        toast.error("Failed to link repository to organization")
      }
    }

    // Show 404 alert if this is a newly created repository
    if (isNewlyCreated) {
      setShow404Alert(true)
    }
  }

  // Auto-dismiss 404 alert after 10 seconds
  useEffect(() => {
    if (show404Alert) {
      const timer = setTimeout(() => {
        setShow404Alert(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [show404Alert])

  return (
    <div className="flex h-screen bg-background-color">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onConfigureRepository={() => setShowRepoModal(true)}
        onCreateRepository={() => setShowCreateRepoModal(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <Button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">CRM Dashboard</h1>
          <div className="w-8" />
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-auto">
          {isValidatingRepo ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-sm text-muted-foreground">Validating repository...</p>
              </div>
            </div>
          ) : showEmptyState ? (
            <EmptyStateView
              validationError={repoValidationError || undefined}
              onCreateRepository={() => setShowCreateRepoModal(true)}
              onConfigureRepository={() => setShowRepoModal(true)}
            />
          ) : (
            <div className="flex-1 space-y-4 p-8 pt-6">
              <div className="flex items-center gap-3">
                {activeSection !== "overview" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleBack}
                    aria-label="Go back"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <h2 className="text-3xl font-bold tracking-tight">
                  {organizations.length === 0 ? "Welcome" : getCurrentSectionTitle()}
                </h2>
              </div>
              
              {/* 404 Alert for newly created repos */}
              {show404Alert && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-700 relative">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm pr-8">
                    Note: The hosted link will show 404 until the first commit is complete (2-3 minutes).
                  </AlertDescription>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 h-6 w-6 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                    onClick={() => setShow404Alert(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Alert>
              )}

              <div className="space-y-4">
                <div className={activeSection === "overview" ? "" : "hidden"}>
                  <OverviewSection onNavigate={setActiveSection} />
                </div>
                <div className={activeSection === "pages" ? "" : "hidden"}>
                  <PagesManagementSection />
                </div>
                <div className={activeSection === "products" ? "" : "hidden"}>
                  <ProductsSection />
                </div>
                <div className={activeSection === "brand-settings" ? "" : "hidden"}>
                  <BrandSettingsView />
                </div>
                <div className={activeSection === "reviews" ? "" : "hidden"}>
                  <ReviewsSection />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Repository Setup Modal */}
      <RepositorySetupModal
        isOpen={showRepoModal}
        onClose={() => {
          setShowRepoModal(false)
        }}
        onRepositoryConfigured={() => {
          setShowRepoModal(false)
        }}
      />

      {/* Repository Create Modal */}
      <RepositoryCreateModal
        isOpen={showCreateRepoModal}
        onClose={() => setShowCreateRepoModal(false)}
        onRepositoryCreated={handleRepositoryCreated}
      />

    </div>
  )
}