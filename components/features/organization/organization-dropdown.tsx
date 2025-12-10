"use client"

import { useEffect } from "react"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Building2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

interface OrganizationDropdownProps {
  isCollapsed?: boolean
  onEditClick?: () => void
}

export function OrganizationDropdown({ isCollapsed = false, onEditClick }: OrganizationDropdownProps) {
  const { organizations, selectedOrgId, setSelectedOrgId, isLoading, fetchOrganizations, hasFetched } = useOrganizationStore()
  
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
          title={organizations.find(org => org.id === selectedOrgId)?.name || "Select Organization"}
        >
          <Building2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2">
        <Select
          value={selectedOrgId || ""}
          onValueChange={(value) => {
            setSelectedOrgId(value)
            if (typeof window !== "undefined") {
              window.localStorage.setItem(storageKey, value)
            }
          }}
        >
          <SelectTrigger className="flex-1 bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-accent-color hover:text-background-color">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4" />
              <SelectValue placeholder={organizations.length === 0 ? "No organizations" : "Select Organization"} />
            </div>
          </SelectTrigger>
          <SelectContent>
            {organizations.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No organizations available
              </div>
            ) : (
              organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
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