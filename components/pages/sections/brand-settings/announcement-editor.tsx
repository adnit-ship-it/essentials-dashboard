"use client";

import { useState, useEffect } from "react";
import { Megaphone, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AnnouncementConfig } from "@/lib/types/pages";
import { DEFAULT_ANNOUNCEMENT_CONFIG } from "@/lib/types/pages";
import { isValidHex } from "@/lib/utils/colors";
import { cn } from "@/lib/utils";

interface AnnouncementEditorProps {
  announcement: AnnouncementConfig | undefined;
  onChange: (announcement: AnnouncementConfig) => void;
}

export function AnnouncementEditor({
  announcement,
  onChange,
}: AnnouncementEditorProps) {
  const [config, setConfig] = useState<AnnouncementConfig>(
    announcement || DEFAULT_ANNOUNCEMENT_CONFIG
  );

  // Sync with external changes
  useEffect(() => {
    if (announcement) {
      setConfig(announcement);
    }
  }, [announcement]);

  const handleChange = (updates: Partial<AnnouncementConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange(newConfig);
  };

  const handleColorChange = (
    field: "backgroundColor" | "textColor",
    value: string
  ) => {
    // Allow any input but only save valid hex colors
    if (isValidHex(value) || value === "") {
      handleChange({ [field]: value.toUpperCase() });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Announcement Bar</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="announcement-enabled" className="text-sm">
              {config.enabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id="announcement-enabled"
              checked={config.enabled}
              onCheckedChange={(enabled) => handleChange({ enabled })}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview */}
        {config.enabled && config.text && (
          <div
            className="rounded-lg overflow-hidden text-center py-3 px-4 text-sm font-medium"
            style={{
              backgroundColor: config.backgroundColor || "#750021",
              color: config.textColor || "#ffffff",
            }}
          >
            {config.text}
            {config.link && (
              <ExternalLink className="inline-block ml-2 h-3.5 w-3.5" />
            )}
          </div>
        )}

        {/* Text Input */}
        <div className="space-y-2">
          <Label htmlFor="announcement-text">Announcement Text</Label>
          <Textarea
            id="announcement-text"
            value={config.text}
            onChange={(e) => handleChange({ text: e.target.value })}
            placeholder="Limited time offer! Get 20% off your first order."
            rows={2}
            className={cn(!config.enabled && "opacity-50")}
            disabled={!config.enabled}
          />
          <p className="text-xs text-muted-foreground">
            Keep it short and impactful (1-2 sentences recommended)
          </p>
        </div>

        {/* Link Input */}
        <div className="space-y-2">
          <Label htmlFor="announcement-link">Click Destination (Optional)</Label>
          <Input
            id="announcement-link"
            value={config.link || ""}
            onChange={(e) => handleChange({ link: e.target.value })}
            placeholder="/consultation or https://example.com"
            className={cn(!config.enabled && "opacity-50")}
            disabled={!config.enabled}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty for non-clickable banner, or enter a URL path
          </p>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="announcement-bg">Background Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={config.backgroundColor || "#750021"}
                onChange={(e) =>
                  handleColorChange("backgroundColor", e.target.value)
                }
                className={cn(
                  "h-10 w-12 cursor-pointer p-1",
                  !config.enabled && "opacity-50"
                )}
                disabled={!config.enabled}
              />
              <Input
                id="announcement-bg"
                value={config.backgroundColor || ""}
                onChange={(e) =>
                  handleColorChange("backgroundColor", e.target.value)
                }
                placeholder="#750021"
                className={cn("flex-1", !config.enabled && "opacity-50")}
                disabled={!config.enabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-text-color">Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={config.textColor || "#ffffff"}
                onChange={(e) =>
                  handleColorChange("textColor", e.target.value)
                }
                className={cn(
                  "h-10 w-12 cursor-pointer p-1",
                  !config.enabled && "opacity-50"
                )}
                disabled={!config.enabled}
              />
              <Input
                id="announcement-text-color"
                value={config.textColor || ""}
                onChange={(e) =>
                  handleColorChange("textColor", e.target.value)
                }
                placeholder="#FFFFFF"
                className={cn("flex-1", !config.enabled && "opacity-50")}
                disabled={!config.enabled}
              />
            </div>
          </div>
        </div>

        {/* Accessibility note */}
        <p className="text-xs text-muted-foreground">
          Ensure sufficient contrast between background and text colors for
          accessibility.
        </p>
      </CardContent>
    </Card>
  );
}
