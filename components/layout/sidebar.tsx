"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Package, X, LogOut, ChevronLeft, ChevronRight, Layout, Palette, GitBranch, Plus, Sparkles, Globe, AlertTriangle, Home } from "lucide-react"

import { OrganizationDropdown } from "@/components/features/organization"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { usePagesStore } from "@/lib/stores/pages-store"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase/client"
import { toast } from "sonner"

const sidebarItems = [
  {
    title: "Overview",
    icon: Home,
    href: "/overview",
    id: "overview",
  },
  {
    title: "Brand Settings",
    icon: Palette,
    href: "/brand-settings",
    id: "brand-settings",
  },
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
]

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activeSection: string
  setActiveSection: (section: string) => void
  onConfigureRepository: () => void
  onCreateRepository?: () => void
}

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeSection,
  setActiveSection,
  onConfigureRepository,
  onCreateRepository,
}: SidebarProps) {
  const router = useRouter()
  const { organizations, isLoading, repoOwnerFromLink, repoNameFromLink, repoValidationError, isValidatingRepo } = useOrganizationStore()
  const hostTemplateInfo = usePagesStore((s) => s.hostTemplateInfo)
  const setHostTemplateInfo = usePagesStore((s) => s.setHostTemplateInfo)
  const fetchData = usePagesStore((s) => s.fetchData)
  const isLoadingPages = usePagesStore((s) => s.isLoading)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHosting, setIsHosting] = useState(false)
  const hasFetchedHostTemplateFallback = useRef<string | null>(null)

  // Fallback: fetch host-template directly when batch didn't return it
  useEffect(() => {
    if (!repoOwnerFromLink || !repoNameFromLink || hostTemplateInfo || isLoadingPages) return
    const repoKey = `${repoOwnerFromLink}/${repoNameFromLink}`
    if (hasFetchedHostTemplateFallback.current === repoKey) return
    hasFetchedHostTemplateFallback.current = repoKey
    const apiUrl = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
    const url = `${apiUrl}/api/host-template?owner=${encodeURIComponent(repoOwnerFromLink)}&repo=${encodeURIComponent(repoNameFromLink)}`
    fetch(url)
      .then((res) => {
        if (res.ok) return res.json()
        if (res.status === 404) return null
        throw new Error(`Failed to fetch host template: ${res.status}`)
      })
      .then((data) => {
        if (data?.templateName) {
          setHostTemplateInfo({
            templateName: data.templateName || "",
            hostedAt: data.hostedAt || "",
          })
        }
      })
      .catch((err) => {
        console.error("Error fetching host template fallback:", err)
        hasFetchedHostTemplateFallback.current = null
      })
  }, [repoOwnerFromLink, repoNameFromLink, hostTemplateInfo, isLoadingPages, setHostTemplateInfo])

  const handleLogout = async () => {
    try {
      // Clear organization selection from store
      const { setSelectedOrgId } = useOrganizationStore.getState()
      setSelectedOrgId(null)
      
      // Clear organization selection from localStorage
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("cv.selectedOrganizationId")
      }
      
      await signOut(auth)
    } finally {
      router.push("/login")
    }
  }

  const handleHost = async () => {
    if (!repoOwnerFromLink || !repoNameFromLink) return;

    setIsHosting(true);
    try {
      // Use relative URL in browser (same origin, no CORS), or configured URL on server
      const apiUrl = typeof window !== "undefined" 
        ? "" // Relative URL in browser
        : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");
      const url = `${apiUrl}/api/repositories/host?owner=${encodeURIComponent(repoOwnerFromLink)}&repo=${encodeURIComponent(repoNameFromLink)}`;

      const response = await fetch(url, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to host repository");
      }

      const data = await response.json();

      // Refresh template data to get updated hostTemplate.json
      await fetchData();

      toast.success(`Repository hosted successfully! ${data.deploymentUrl}`);
    } catch (error) {
      console.error("Error hosting repository:", error);
      toast.error(error instanceof Error ? error.message : "Failed to host repository");
    } finally {
      setIsHosting(false);
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
          "fixed inset-y-0 left-0 z-50 bg-sidebar  border-r border-sidebar-border transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
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
              onEditClick={onCreateRepository}
            />
          </div>

          {/* Repository Management Section */}
          {!isCollapsed && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider px-3">
                Repositories
              </div>

              {onCreateRepository && (
                <Button
                  onClick={onCreateRepository}
                  className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] active:bg-gradient-to-r active:from-[#DDF0E3] active:to-[#D3EBEB] hover:text-black active:text-black transition-all duration-200 justify-start gap-3 px-3"
                >
                  <Sparkles className="h-4 w-4 flex-shrink-0" />
                  <span className="transition-opacity duration-300 whitespace-nowrap">
                    Create Repository
                  </span>
                </Button>
              )}



              {/* Repository Info Card */}
              {repoNameFromLink && (
                <Card className="bg-sidebar border-sidebar-border ">
                  <CardContent className="p-0">
                    {repoValidationError && (
                      <div className="mb-2  bg-destructive/10 border border-destructive/20 rounded-md mx-3 mt-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-destructive mb-1">
                              Repository Not Found
                            </div>
                            <p className="text-xs text-destructive/80">
                              {repoValidationError}
                            </p>
                            {onCreateRepository && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-7 text-xs"
                                onClick={onCreateRepository}
                              >
                                Fix Repository Link
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {isValidatingRepo && (
                      <div className="mb-2 p-2 bg-muted border border-border rounded-md mx-3 mt-3">
                        <div className="flex items-center gap-2">
                          <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-sidebar-foreground"></div>
                          <span className="text-xs text-sidebar-foreground/70">Validating repository...</span>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col">
                      {/* Strip 1: Current Repository */}
                      <div className="flex-1 flex flex-col justify-center px-3 py-3">
                        <div className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-1">
                          Repository 
                        </div>
                        <div className="text-sm font-medium text-sidebar-foreground truncate">
                          {repoNameFromLink}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-sidebar-border mx-3"></div>

                      {/* Strip 2: Template */}
                      <div className="flex-1 flex flex-col justify-center px-3 py-3">
                        <div className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-1">
                          Template
                        </div>
                        <div className="text-sm text-sidebar-foreground/80">
                          {isLoadingPages ? "…" : hostTemplateInfo?.templateName ?? "—"}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-sidebar-border mx-3"></div>

                      {/* Strip 3: Hosted At or Host Button */}
                      <div className="flex-1 flex flex-col justify-center px-3 py-3 relative group">
                        {hostTemplateInfo?.hostedAt ? (
                          <>
                            {/* Content wrapper with blur on hover */}
                            <div className="transition-all group-hover:blur-sm">
                              <div className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-1">
                                Hosted At
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-blue-600">
                                <span className="truncate">{hostTemplateInfo.hostedAt}</span>
                                <ExternalLink className="h-3 w-3 opacity-50 flex-shrink-0" />
                              </div>
                            </div>
                            {/* Hover overlay */}
                            <div className="absolute inset-0 hidden group-hover:flex items-center justify-center backdrop-blur-sm rounded-md">
                              <Button
                                onClick={() => window.open(hostTemplateInfo.hostedAt, '_blank', 'noopener,noreferrer')}
                                variant="default"
                                size="sm"
                                className="pointer-events-auto"
                              >
                                Visit Link
                              </Button>
                            </div>
                          </>
                        ) : (
                          repoNameFromLink && (
                            <Button
                              onClick={handleHost}
                              disabled={isHosting}
                              className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] active:bg-gradient-to-r active:from-[#DDF0E3] active:to-[#D3EBEB] hover:text-black active:text-black transition-all duration-200 justify-start gap-3 px-3 disabled:opacity-50"
                            >
                              <Globe className="h-4 w-4 flex-shrink-0" />
                              <span className="transition-opacity duration-300 whitespace-nowrap">
                                {isHosting ? "Hosting..." : "Host"}
                              </span>
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Collapsed Repository Buttons */}
          {isCollapsed && (
            <div className="mt-4 space-y-2 px-2">
              <Button
                onClick={onConfigureRepository}
                className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-accent-color hover:text-background-color justify-center p-2"
                title="Configure Repository"
              >
                <Plus className="h-4 w-4" />
              </Button>
              {onCreateRepository && (
                <Button
                  onClick={onCreateRepository}
                  className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-accent-color hover:text-background-color justify-center p-2"
                  title="Create Repository"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}
              {/* Host Button - collapsed state */}
              {repoNameFromLink && !hostTemplateInfo?.hostedAt && (
                <Button
                  onClick={handleHost}
                  disabled={isHosting}
                  className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-accent-color hover:text-background-color justify-center p-2 disabled:opacity-50"
                  title="Host Repository"
                >
                  <Globe className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

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
