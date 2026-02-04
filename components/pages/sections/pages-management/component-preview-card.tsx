"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { EditorType } from "./component-mapper"
import { getPreviewComponent } from "./component-previews/preview-registry"
import { cn } from "@/lib/utils"

interface ComponentPreviewCardProps {
  componentKey: string
  value: any
  componentIndex: number
  editorType: EditorType
  templateName?: string | null
  repoOwner?: string | null
  repoName?: string | null
  repoBranch?: string
  onClick: () => void
  onShowToggle: (checked: boolean) => void
  show: boolean
}

export function ComponentPreviewCard({
  componentKey,
  value,
  editorType,
  templateName,
  repoOwner,
  repoName,
  repoBranch,
  onClick,
  onShowToggle,
  show,
}: ComponentPreviewCardProps) {
  // Get show value from the value object if it exists
  const showValue = typeof value === "object" && value !== null && !Array.isArray(value)
    ? value.show !== false
    : show

  const handleShowToggle = (checked: boolean) => {
    onShowToggle(checked)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on the switch or color swatch
    if (
      (e.target as HTMLElement).closest('[role="switch"]') ||
      (e.target as HTMLElement).closest('[data-color-swatch]')
    ) {
      return
    }
    onClick()
  }

  // Get the appropriate preview component for this editor type
  const PreviewComponent = getPreviewComponent(editorType)

  // Format the component key for display
  const formattedTitle = componentKey
    .replace(/([A-Z])/g, " $1")
    .replace(/-/g, " ")
    .trim()

  return (
    <Card
      className={cn(
        "cursor-pointer hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] transition-all duration-200 overflow-hidden h-full flex flex-col"
      )}
      onClick={handleCardClick}
    >
      {/* Preview Area */}
      <div className="relative aspect-video bg-muted overflow-hidden flex items-center justify-center p-4">
        <PreviewComponent
          componentKey={componentKey}
          value={value}
          onClick={onClick}
          editorType={editorType}
          templateName={templateName}
          repoOwner={repoOwner}
          repoName={repoName}
          repoBranch={repoBranch}
        />
      </div>

      {/* Card Content */}
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 flex-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm capitalize line-clamp-1">
              {formattedTitle}
            </h3>
          </div>

          {/* Show Toggle */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <Label htmlFor={`show-${componentKey}`} className="text-xs text-muted-foreground">
              Show
            </Label>
            <Switch
              id={`show-${componentKey}`}
              checked={showValue}
              onCheckedChange={handleShowToggle}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
