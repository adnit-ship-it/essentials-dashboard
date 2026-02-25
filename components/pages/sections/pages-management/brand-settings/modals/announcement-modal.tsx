"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ExternalLink, Megaphone } from "lucide-react"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { DEFAULT_ANNOUNCEMENT_CONFIG, type AnnouncementConfig } from "@/lib/types/pages"
import { ColorInput } from "../../component-editors/shared/color-input"
import { resolveBrandColor, useBrandColors, DEFAULT_BRAND_COLORS } from "@/lib/utils/brand-colors"
import { isValidHex } from "@/lib/utils/colors"

interface AnnouncementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnnouncementModal({ open, onOpenChange }: AnnouncementModalProps) {
  const { commonData, updateAnnouncement } = usePagesStore()
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const { colors: brandColors } = useBrandColors(repoOwnerFromLink, repoNameFromLink)
  const [announcement, setAnnouncement] = useState<AnnouncementConfig>(
    commonData?.announcement || DEFAULT_ANNOUNCEMENT_CONFIG
  )

  // Sync with store when modal opens
  useEffect(() => {
    if (open) {
      setAnnouncement(commonData?.announcement || DEFAULT_ANNOUNCEMENT_CONFIG)
    }
  }, [open, commonData?.announcement])

  // Resolve brand colors to actual hex for preview
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

  const handleChange = (updates: Partial<AnnouncementConfig>) => {
    const updated = { ...announcement, ...updates }
    setAnnouncement(updated)
    updateAnnouncement(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcement Bar
          </DialogTitle>
          <DialogDescription>
            Configure the site-wide announcement banner that appears at the top of every page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Announcement Bar</Label>
              <p className="text-xs text-muted-foreground">
                Show the announcement banner on your site
              </p>
            </div>
            <Switch
              checked={announcement.enabled}
              onCheckedChange={(enabled) => handleChange({ enabled })}
            />
          </div>

          {announcement.enabled && (
            <>
              {/* Announcement Text */}
              <div className="space-y-2">
                <Label htmlFor="announcement-text">Announcement Text</Label>
                <Textarea
                  id="announcement-text"
                  placeholder="Enter your announcement message..."
                  value={announcement.text}
                  onChange={(e) => handleChange({ text: e.target.value })}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Keep it short and attention-grabbing
                </p>
              </div>

              {/* Optional Link */}
              <div className="space-y-2">
                <Label htmlFor="announcement-link" className="flex items-center gap-2">
                  Link URL <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="announcement-link"
                  type="url"
                  placeholder="https://example.com/promo"
                  value={announcement.link || ""}
                  onChange={(e) => handleChange({ link: e.target.value || undefined })}
                />
                <p className="text-xs text-muted-foreground">
                  Add a link to make the announcement clickable
                </p>
              </div>

              {/* Colors */}
              <div className="space-y-4">
                <ColorInput
                  label="Background Color"
                  value={announcement.backgroundColor}
                  onChange={(value) => handleChange({ backgroundColor: value })}
                  allowBrandColors={true}
                />

                <ColorInput
                  label="Text Color"
                  value={announcement.textColor}
                  onChange={(value) => handleChange({ textColor: value })}
                  allowBrandColors={true}
                />
              </div>

              {/* Live Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  className="w-full rounded-md flex items-center justify-center px-4 py-3"
                  style={{
                    backgroundColor: resolvedBackgroundColor,
                    color: resolvedTextColor,
                  }}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{announcement.text || "Your announcement here..."}</span>
                    {announcement.link && (
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
