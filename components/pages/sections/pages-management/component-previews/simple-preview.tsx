"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatComponentNameForEdit } from "./shared/format-component-name"
import type { EditorType } from "../component-mapper"
import type { BasePreviewProps } from "./shared/preview-props"

interface SimplePreviewProps extends BasePreviewProps {
  editorType: EditorType
}

export function SimplePreview({ editorType, value, componentKey, onClick }: SimplePreviewProps) {
  const componentName = formatComponentNameForEdit(componentKey)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  // Number display
  if (editorType === "number") {
    const numValue = typeof value === "number" ? value : (typeof value === "string" ? parseFloat(value) : 0)
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="text-3xl font-bold text-foreground text-center transition-all group-hover:blur-sm" onClick={onClick}>
          {isNaN(numValue) ? "—" : numValue}
        </div>
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

  // Boolean display
  if (editorType === "boolean") {
    const boolValue = typeof value === "boolean" ? value : (value?.show !== false)
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="flex items-center justify-center transition-all group-hover:blur-sm" onClick={onClick}>
          {boolValue ? (
            <Check className="w-16 h-16 text-green-500" strokeWidth={3} />
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-muted-foreground" />
          )}
        </div>
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

  // SimpleText display
  if (editorType === "simpleText") {
    const textValue = typeof value === "string" ? value : (value?.text || "")
    return (
      <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
        <div className="text-xl font-semibold line-clamp-1 text-foreground transition-all group-hover:blur-sm" onClick={onClick}>
          {textValue || "—"}
        </div>
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

  return null
}
