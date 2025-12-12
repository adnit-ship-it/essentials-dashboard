"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

import { FormsSection, ProductsSection, ReviewsSection, PagesManagementSection } from "@/components/pages"
import { BrandSettingsView } from "@/components/pages/sections/pages-management/brand-settings/brand-settings-view"
import { OrganizationConfigModal } from "@/components/features/organization"
import { RepositorySetupModal } from "@/components/features/repository"
import { Sidebar } from "./sidebar"
import { useOrganizationStore } from "@/lib/stores/organization-store"

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("brand-settings")
  const [showRepoModal, setShowRepoModal] = useState(false)
  const [showOrgConfig, setShowOrgConfig] = useState(false)
  const router = useRouter()
  
  const { organizations, fetchOrganizations, isLoading, hasFetched } = useOrganizationStore()

  useEffect(() => {
    fetchOrganizations()
  }, [])


  const getCurrentSectionTitle = () => {
    const sections = [
      { id: "pages", title: "Pages & Sections" },
      { id: "forms", title: "Forms" },
      { id: "products", title: "Products" },
      { id: "brand-settings", title: "Brand Settings" },
    ]
    return sections.find((section) => section.id === activeSection)?.title || "Dashboard"
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
        showOrgConfig={showOrgConfig}
        setShowOrgConfig={setShowOrgConfig}
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
          <div className="flex-1">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-background border-b pb-4 pt-6 px-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">
                  {organizations.length === 0 ? "Welcome" : getCurrentSectionTitle()}
                </h2>
              </div>
            </div>
            {/* Content */}
            <div className="p-8 space-y-4">
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

      {/* Organization Config Modal */}
      <OrganizationConfigModal
        isOpen={showOrgConfig}
        onClose={() => setShowOrgConfig(false)}
      />
    </div>
  )
}
