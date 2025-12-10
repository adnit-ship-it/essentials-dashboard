"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { usePagesStore } from "@/lib/stores/pages-store"
import { LogoSelector } from "../component-editors/shared/logo-selector"

const LOGO_LABELS = {
  primary: "Primary Logo",
  secondary: "Secondary Logo",
}

const LOGO_DESCRIPTIONS = {
  primary: "Displayed across the application as the main logo.",
  secondary: "Used in contexts that require an alternate mark.",
}

export function PrimarySecondaryLogos() {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const { pagesData, updatePagesData } = usePagesStore()
  const [updating, setUpdating] = useState<"primary" | "secondary" | null>(null)

  if (!pagesData?.logoRegistry) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Logo registry not available.</p>
        </CardContent>
      </Card>
    )
  }

  const logoRegistry = pagesData.logoRegistry
  const primaryLogo = Object.entries(logoRegistry).find(([_, entry]) => entry.type === "primary")?.[1]
  const secondaryLogo = Object.entries(logoRegistry).find(([_, entry]) => entry.type === "secondary")?.[1]

  const handleLogoUpdate = async (slot: "primary" | "secondary", newPath: string) => {
    if (!repoOwnerFromLink || !repoNameFromLink) return

    setUpdating(slot)

    try {
      // Find existing logo entry or create new
      const existingKey = Object.entries(logoRegistry).find(
        ([_, entry]) => entry.type === slot
      )?.[0]

      if (existingKey) {
        // Update existing entry
        updatePagesData((data) => {
          const updated = { ...data }
          if (updated.logoRegistry) {
            updated.logoRegistry = {
              ...updated.logoRegistry,
              [existingKey]: {
                ...updated.logoRegistry[existingKey],
                path: newPath,
              },
            }
          }
          return updated
        })
      } else {
        // Create new entry
        const newKey = slot === "primary" ? "logo1" : "logo2"
        updatePagesData((data) => {
          const updated = { ...data }
          if (!updated.logoRegistry) {
            updated.logoRegistry = {}
          }
          updated.logoRegistry = {
            ...updated.logoRegistry,
            [newKey]: {
              type: slot,
              path: newPath,
              description: LOGO_LABELS[slot],
            },
          }
          return updated
        })
      }
    } catch (err) {
      console.error("Failed to update logo:", err)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Primary Logo</CardTitle>
          <CardDescription>{LOGO_DESCRIPTIONS.primary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LogoSelector
            label="Select from Registry"
            value={primaryLogo?.path || ""}
            onChange={(path) => handleLogoUpdate("primary", path)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Secondary Logo</CardTitle>
          <CardDescription>{LOGO_DESCRIPTIONS.secondary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LogoSelector
            label="Select from Registry"
            value={secondaryLogo?.path || ""}
            onChange={(path) => handleLogoUpdate("secondary", path)}
          />
        </CardContent>
      </Card>
    </div>
  )
}




