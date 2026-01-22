"use client"

import { getArrayDisplayText, normalizeTemplateName } from "@/lib/utils/component-value-formatter"
import type { BasePreviewProps } from "./shared/preview-props"

export function ArrayCountPreview({ componentKey, value, templateName }: BasePreviewProps) {
  const templateType = normalizeTemplateName(templateName ?? null)
  const displayText = getArrayDisplayText(value, componentKey, templateType)
  console.log("displayText for array count preview: ", displayText)
  return (
    <div className="text-xl font-semibold text-foreground">
      {displayText || "0 items"}
    </div>
  )
}
