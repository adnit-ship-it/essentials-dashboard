"use client"

import { Check } from "lucide-react"
import type { EditorType } from "../component-mapper"
import type { BasePreviewProps } from "./shared/preview-props"

interface SimplePreviewProps extends BasePreviewProps {
  editorType: EditorType
}

export function SimplePreview({ editorType, value }: SimplePreviewProps) {
  // Number display
  if (editorType === "number") {
    const numValue = typeof value === "number" ? value : (typeof value === "string" ? parseFloat(value) : 0)
    return (
      <div className="text-3xl font-bold text-foreground  text-center" >
        {isNaN(numValue) ? "—" : numValue}
      </div>
    )
  }

  // Boolean display
  if (editorType === "boolean") {
    const boolValue = typeof value === "boolean" ? value : (value?.show !== false)
    return (
      <div className="flex items-center justify-center">
        {boolValue ? (
          <Check className="w-16 h-16 text-green-500" strokeWidth={3} />
        ) : (
          <div className="w-16 h-16 rounded-full border-4 border-muted-foreground" />
        )}
      </div>
    )
  }

  // SimpleText display
  if (editorType === "simpleText") {
    const textValue = typeof value === "string" ? value : (value?.text || "")
    return (
      <div className="text-xl font-semibold line-clamp-1 text-foreground">
        {textValue || "—"}
      </div>
    )
  }

  return null
}
