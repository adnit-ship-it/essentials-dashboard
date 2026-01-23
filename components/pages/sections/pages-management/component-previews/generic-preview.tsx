"use client"

import { Button } from "@/components/ui/button"
import { formatComponentNameForEdit } from "./shared/format-component-name"
import type { BasePreviewProps } from "./shared/preview-props"

export function GenericPreview({ componentKey, onClick }: BasePreviewProps) {
  const componentName = formatComponentNameForEdit(componentKey)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <div className="group relative w-full h-full flex items-center justify-center cursor-pointer rounded-md">
      <div className="text-xl font-semibold text-foreground transition-all group-hover:blur-sm" onClick={onClick}>
        {componentName}
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
