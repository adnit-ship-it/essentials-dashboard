"use client"

import { Button } from "@/components/ui/button"
import { getArrayDisplayText, normalizeTemplateName } from "@/lib/utils/component-value-formatter"
import { formatComponentNameForEdit } from "./shared/format-component-name"
import type { BasePreviewProps } from "./shared/preview-props"

export function ArrayCountPreview({ componentKey, value, templateName, onClick }: BasePreviewProps) {
  const templateType = normalizeTemplateName(templateName ?? null)
  const displayText = getArrayDisplayText(value, componentKey, templateType)
  const componentName = formatComponentNameForEdit(componentKey)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
      {/* Content wrapper with blur on hover */}
      <div className="text-xl font-semibold text-foreground transition-all group-hover:blur-sm" onClick={onClick}>
        {displayText || "0 items"}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 hidden group-hover:flex items-center justify-center backdrop-blur-sm">
        <Button
          variant="default"
          size="sm"
          onClick={handleButtonClick}
          className="pointer-events-auto"
        >
          Edit {componentName}
        </Button>
      </div>
    </div>
  )
}
