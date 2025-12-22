"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

import { FormsSection, ProductsSection, ReviewsSection, PagesManagementSection } from "@/components/pages"
import { BrandSettingsView } from "@/components/pages/sections/pages-management/brand-settings/brand-settings-view"
import { RepositorySetupModal, RepositoryCreateModal } from "@/components/features/repository"
import { Sidebar } from "./sidebar"
import { EmptyStateView } from "./empty-state-view"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useRepositoryStore } from "@/lib/stores/repository-store"
import { toast } from "sonner"

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("pages")
  const [showRepoModal, setShowRepoModal] = useState(false)
  const [showCreateRepoModal, setShowCreateRepoModal] = useState(false)
  const router = useRouter()
  
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
    repoNameFromLink 
  } = useOrganizationStore()

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  // When an organization is selected and has a linked repo, ensure it's configured and selected
  useEffect(() => {
    if (selectedOrgId && repoOwnerFromLink && repoNameFromLink) {
      ensureRepoConfigured(repoOwnerFromLink, repoNameFromLink).catch((error) => {
        console.error("Error ensuring repo is configured:", error)
      })
    }
  }, [selectedOrgId, repoOwnerFromLink, repoNameFromLink, ensureRepoConfigured])

  // When an organization is selected without a linked repo, open the create/link modal
  useEffect(() => {
    if (selectedOrgId && !repoOwnerFromLink && !repoNameFromLink && !showCreateRepoModal) {
      setShowCreateRepoModal(true)
    }
  }, [selectedOrgId, repoOwnerFromLink, repoNameFromLink, showCreateRepoModal])

  const getCurrentSectionTitle = () => {
    const sections = [
      { id: "pages", title: "Pages & Sections" },
      { id: "forms", title: "Forms" },
      { id: "products", title: "Products" },
      { id: "brand-settings", title: "Brand Settings" },
    ]
    return sections.find((section) => section.id === activeSection)?.title || "Dashboard"
  }

  // Determine if we should show the empty state
  // Show empty state only if:
  // - An organization is selected AND it has no linked repository
  // - OR no organization is selected AND no repository is selected/configured
  const showEmptyState = useMemo(() => {
    if (selectedOrgId) {
      // If an org is selected, check if it has a linked repo
      const hasLinkedRepo = !!(repoOwnerFromLink && repoNameFromLink)
      // Show empty state only if the selected org has no linked repo
      return !hasLinkedRepo
    }
    // No org selected - show empty state if no repo is selected/configured
    return !selectedRepoId && configuredRepos.length === 0
  }, [selectedOrgId, repoOwnerFromLink, repoNameFromLink, selectedRepoId, configuredRepos])

  const handleRepositoryCreated = async (owner: string | null, repo: string | null) => {
    setShowCreateRepoModal(false)
    fetchAvailableRepos() // Refresh repos after creation

    if (owner && repo && selectedOrgId) {
      // Link the repository directly to the organization
      const { updatePartnerIntegrationBillOfRights } = useOrganizationStore.getState()
      try {
        await updatePartnerIntegrationBillOfRights({
          repoOwner: owner,
          repoName: repo,
          linkName: undefined, // Will use existing linkName if any
        })
        toast.success(`Repository '${repo}' linked to organization successfully!`)
      } catch (error) {
        console.error("Error linking repository:", error)
        toast.error("Failed to link repository to organization")
      }
    }
  }

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
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-auto">
          {showEmptyState ? (
            <EmptyStateView
              title="No Repository Selected"
              message="To get started, create a new repository or configure an existing one."
              onCreateRepository={() => setShowCreateRepoModal(true)}
              onConfigureRepository={() => setShowRepoModal(true)}
            />
          ) : (
            <div className="flex-1 space-y-4 p-8 pt-6">
              <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                  {organizations.length === 0 ? "Welcome" : getCurrentSectionTitle()}
                </h2>
              </div>
              <div className="space-y-4">
                {/* Render all sections simultaneously, hide inactive ones with CSS */}
                {/* This prevents remounting and preserves state across tab switches */}
                <div className={activeSection === "pages" ? "" : "hidden"}>
                  <PagesManagementSection />
                </div>
                <div className={activeSection === "products" ? "" : "hidden"}>
                  <ProductsSection />
                </div>
                <div className={activeSection === "brand-settings" ? "" : "hidden"}>
                  <BrandSettingsView />
                </div>
                <div className={activeSection === "forms" ? "" : "hidden"}>
                  <FormsSection />
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
        onClose={() => setShowRepoModal(false)}
        onRepositoryConfigured={() => {
          setShowRepoModal(false)
          // Force reload of all sections by triggering a state update
          // The sections will automatically reload when repo changes
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
