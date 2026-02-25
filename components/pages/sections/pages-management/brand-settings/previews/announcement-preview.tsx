"use client"

import { useMemo } from "react"
import { usePagesStore } from "@/lib/stores/pages-store"
import { Megaphone, ExternalLink } from "lucide-react"
import { DEFAULT_ANNOUNCEMENT_CONFIG } from "@/lib/types/pages"
import { resolveBrandColor, useBrandColors, DEFAULT_BRAND_COLORS } from "@/lib/utils/brand-colors"
import { isValidHex } from "@/lib/utils/colors"

interface AnnouncementPreviewProps {
  onEdit: () => void
  repoOwner: string | null
  repoName: string | null
}

export function AnnouncementPreview({ onEdit, repoOwner, repoName }: AnnouncementPreviewProps) {
  const { commonData } = usePagesStore()
  const { colors: brandColors } = useBrandColors(repoOwner, repoName)
  const announcement = commonData?.announcement || DEFAULT_ANNOUNCEMENT_CONFIG

  // Resolve brand colors to actual hex for display
  const resolvedBackgroundColor = useMemo(() => {
    const colors = brandColors ?? DEFAULT_BRAND_COLORS
    const resolved = resolveBrandColor(announcement.backgroundColor, colors)
    return resolved && isValidHex(resolved) ? resolved : announcement.backgroundColor
  }, [announcement.backgroundColor, brandColors])

  const resolvedTextColor = useMemo(() => {
    const colors = brandColors ?? DEFAULT_BRAND_COLORS
    const resolved = resolveBrandColor(announcement.textColor, colors)
    return resolved && isValidHex(resolved) ? resolved : announcement.textColor
  }, [announcement.textColor, brandColors])

  if (!announcement.enabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Megaphone className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Announcement bar is disabled</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div 
        className="w-full rounded-md flex items-center justify-center px-3 py-2"
        style={{
          backgroundColor: resolvedBackgroundColor,
          color: resolvedTextColor,
        }}
      >
        <div className="flex items-center gap-2 text-xs font-medium truncate">
          <span className="truncate">{announcement.text || "Your announcement here..."}</span>
          {announcement.link && (
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  )
}
