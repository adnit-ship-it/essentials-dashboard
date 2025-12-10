"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Package, X, LogOut, ChevronLeft, ChevronRight, Layout, Palette } from "lucide-react"

import { OrganizationConfigModal, OrganizationDropdown } from "@/components/features/organization"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase/client"

const sidebarItems = [
  {
    title: "Pages & Sections",
    icon: Layout,
    href: "/pages",
    id: "pages",
  },
  {
    title: "Products",
    icon: Package,
    href: "/products",
    id: "products",
  },
  {
    title: "Brand Settings",
    icon: Palette,
    href: "/brand-settings",
    id: "brand-settings",
  },
  // Forms temporarily hidden
]

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activeSection: string
  setActiveSection: (section: string) => void
  onConfigureRepository: () => void
  showOrgConfig: boolean
  setShowOrgConfig: (show: boolean) => void
}

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeSection,
  setActiveSection,
  onConfigureRepository,
  showOrgConfig,
  setShowOrgConfig,
}: SidebarProps) {
  const router = useRouter()
  const { organizations, isLoading, needsRepoConfig } = useOrganizationStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (needsRepoConfig && !isCollapsed) {
      setShowOrgConfig(true)
    }
  }, [needsRepoConfig, isCollapsed, setShowOrgConfig])

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } finally {
      router.push("/login")
    }
  }

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-80",
          isCollapsed ? "cursor-pointer" : ""
        )}
        onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                Essentials Dashboard
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                Navigation
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Collapse button - only show when expanded on desktop */}
            {!isCollapsed && (
              <Button
                className="hidden lg:flex h-8 w-8 p-0 bg-transparent hover:bg-transparent cursor-pointer text-sidebar-foreground"
                onClick={() => setIsCollapsed(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {/* Mobile close button */}
            <Button className="lg:hidden h-8 w-8 p-0 bg-transparent hover:bg-transparent cursor-pointer text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-3 py-4" onClick={(e) => e.stopPropagation()}>
          {/* Repository Selector removed: repo owner/name now derive from organization settings */}

          {/* Organization Dropdown - Keep for now */}
          <div className={cn(isCollapsed ? "h-16" : "")}>
            <OrganizationDropdown
              isCollapsed={isCollapsed}
              onEditClick={() => setShowOrgConfig(true)}
            />
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-gray-300 w-full"></div>

          {/* Navigation Items - always show for testing API calls */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  className={cn(
                    "text-sidebar-foreground bg-transparent cursor-pointer hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] active:bg-gradient-to-r active:from-[#DDF0E3] active:to-[#D3EBEB] hover:text-black active:text-black transition-all duration-200",
                    activeSection === item.id && "bg-gradient-to-r from-[#DDF0E3] to-[#D3EBEB] text-black",
                    isCollapsed ? "w-8 h-8 justify-center p-0" : "w-full justify-start gap-3 px-3"
                  )}
                  onClick={() => {
                    setActiveSection(item.id)
                    setSidebarOpen(false)
                  }}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="transition-opacity duration-300 whitespace-nowrap">
                      {item.title}
                    </span>
                  )}
                </Button>
              )
            })}
          </nav>

          {/* Show message when no organizations - commented out for testing
          {!isLoading && organizations.length === 0 && !isCollapsed && (
            <div className="text-center text-sidebar-foreground/70 text-sm py-8">
              <p>No organizations found.</p>
              <p className="mt-1">Create one to get started.</p>
            </div>
          )}
          */}

          {/* Divider */}
          <div className="my-6 h-px bg-gray-300 w-full"></div>

          {/* Logout button */}
          <div>
            <Button
              className={cn(
                "w-full justify-start cursor-pointer gap-3 text-sidebar-foreground bg-transparent hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] active:bg-gradient-to-r active:from-[#DDF0E3] active:to-[#D3EBEB] hover:text-black active:text-black transition-all duration-200",
                isCollapsed ? "px-2" : "px-3"
              )}
              onClick={handleLogout}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && (
                <span className="transition-opacity duration-300 whitespace-nowrap">
                  Logout
                </span>
              )}
            </Button>
          </div>
        </ScrollArea>
      </div>
    </>
  )
}