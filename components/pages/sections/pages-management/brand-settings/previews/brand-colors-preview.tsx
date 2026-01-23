"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useBrandColors, resolveBrandColor, getTextColorForBackground } from "@/lib/utils/brand-colors"
import { useOrganizationStore } from "@/lib/stores/organization-store"

interface BrandColorsPreviewProps {
  onEdit: () => void
  repoOwner?: string | null
  repoName?: string | null
}

const COLOR_LABELS: Record<string, string> = {
  backgroundColor: "Background",
  bodyColor: "Body",
  accentColor1: "Accent 1",
  accentColor2: "Accent 2",
}

const COLOR_ORDER: Array<keyof typeof COLOR_LABELS> = [
  "backgroundColor",
  "bodyColor",
  "accentColor1",
  "accentColor2",
]

export function BrandColorsPreview({ onEdit, repoOwner, repoName }: BrandColorsPreviewProps) {
  const { colors: brandColors, loading } = useBrandColors(repoOwner, repoName)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit()
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground text-center">
          Loading colors...
        </div>
      </div>
    )
  }

  // Use brand colors if available, otherwise use defaults
  const colors = brandColors || {
    backgroundColor: "#FFFFFF",
    bodyColor: "#000000",
    accentColor1: "#FF6B35",
    accentColor2: "#004E89",
  }

  return (
    <div className="group relative w-full h-full flex flex-col cursor-pointer rounded-md overflow-hidden">
      {/* Content wrapper with blur on hover */}
      <div className="w-full h-full flex flex-col transition-all group-hover:blur-sm">
        {COLOR_ORDER.map((colorKey, index) => {
          // Fix: avoid index signature error by enforcing keyof typeof COLOR_LABELS
          const colorValue =
            colors[colorKey as keyof typeof colors] || "#FFFFFF"
          const resolvedColor = resolveBrandColor(colorValue, brandColors)
          const textColor = getTextColorForBackground(resolvedColor, brandColors)
          const label = COLOR_LABELS[colorKey] || colorKey

          return (
            <div
              key={colorKey}
              className="flex-1 flex items-center justify-center"
              style={{
                backgroundColor: resolvedColor,
                color: textColor,
              }}
            >
              <span className="text-xs font-medium text-center px-2">
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 hidden group-hover:flex items-center justify-center backdrop-blur-sm">
        <Button
          variant="default"
          size="sm"
          onClick={handleButtonClick}
          className="pointer-events-auto"
        >
          Edit
        </Button>
      </div>
    </div>
  )
}
