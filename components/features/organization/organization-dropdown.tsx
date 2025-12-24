"use client"

import { useEffect, useState } from "react"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Building2, Pencil, Search, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import * as PopoverPrimitive from "@radix-ui/react-popover"

interface OrganizationDropdownProps {
  isCollapsed?: boolean
  onEditClick?: () => void
}

export function OrganizationDropdown({ isCollapsed = false, onEditClick }: OrganizationDropdownProps) {
  const { organizations, selectedOrgId, setSelectedOrgId, isLoading, fetchOrganizations, hasFetched } = useOrganizationStore()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Fetch organizations on mount if not already fetched
  useEffect(() => {
    if (!hasFetched && !isLoading) {
      fetchOrganizations()
    }
  }, [hasFetched, isLoading, fetchOrganizations])
  
  // Load previously selected organization from localStorage on mount
  // and persist selection changes back to localStorage
  // Key is namespaced to avoid collisions
  const storageKey = "cv.selectedOrganizationId"
  
  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(storageKey)
      if (saved && !selectedOrgId) {
        setSelectedOrgId(saved)
      }
    }
  }, [selectedOrgId, setSelectedOrgId])
  
  // Persist changes
  useEffect(() => {
    if (typeof window !== "undefined" && selectedOrgId) {
      window.localStorage.setItem(storageKey, selectedOrgId)
    }
  }, [selectedOrgId])

  // Filter organizations based on search query
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedOrg = organizations.find(org => org.id === selectedOrgId)

  const handleSelect = (orgId: string) => {
    setSelectedOrgId(orgId)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, orgId)
    }
    setOpen(false)
    setSearchQuery("")
  }

  if (isLoading) {
    return (
      <div className={cn(
        "w-full justify-start gap-3 text-sidebar-foreground bg-transparent rounded-md transition-all duration-200",
        isCollapsed ? "px-2 py-2" : "px-3 py-2"
      )}>
        <Building2 className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && (
          <span className="text-sm transition-opacity duration-300 whitespace-nowrap">
            Loading organizations...
          </span>
        )}
      </div>
    )
  }

  if (isCollapsed) {
    return (
      <div className="px-2 py-2">
        <Button
          className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-accent-color hover:text-background-color justify-center p-2"
          title={selectedOrg?.name || "Select Organization"}
        >
          <Building2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="px-3 py-2">
      {/* Organization Label */}
      <div className="mb-2">
        <Label className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider px-3">
          Organization
        </Label>
      </div>
      
      <div className="flex items-center gap-2">
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          <PopoverPrimitive.Trigger asChild>
            <Button
              variant="outline"
              className="flex-1 bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-accent-color hover:text-background-color justify-between h-10"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {selectedOrg?.name || "Select Organization"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </Button>
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              className={cn(
                "z-50 w-[var(--radix-popover-trigger-width)] rounded-md border border-sidebar-border bg-sidebar p-1 shadow-md",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              )}
              align="start"
              sideOffset={4}
            >
              {/* Search Input */}
              <div className="flex items-center border-b border-sidebar-border px-3 py-2">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-sidebar-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setOpen(false)
                    }
                  }}
                />
              </div>
              
              {/* Organizations List */}
              <div className="max-h-[300px] overflow-auto">
                {filteredOrganizations.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-sidebar-foreground/70">
                    {searchQuery ? "No organizations found" : "No organizations available"}
                  </div>
                ) : (
                  filteredOrganizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleSelect(org.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm transition-colors text-sidebar-foreground",
                        "hover:bg-accent-color hover:text-background-color",
                        selectedOrgId === org.id && "bg-accent-color/50"
                      )}
                    >
                      <div className="flex-1 text-left truncate">{org.name}</div>
                      {selectedOrgId === org.id && (
                        <Check className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
        
        {selectedOrgId && onEditClick && (
          <Button
            className="h-10 w-10 p-0 bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-accent-color hover:text-background-color"
            onClick={onEditClick}
            title="Edit organization configuration"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}