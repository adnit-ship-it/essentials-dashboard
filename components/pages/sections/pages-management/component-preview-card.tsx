"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md aspect-square",
        "flex flex-col h-full"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm capitalize line-clamp-1">
            {componentKey.replace(/([A-Z])/g, " $1").replace(/-/g, " ")}
          </CardTitle>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2"
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
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center overflow-hidden p-4">
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
      </CardContent>
    </Card>
  )
}
