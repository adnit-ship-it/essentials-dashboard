"use client"

import { Button } from "@/components/ui/button"
import type { BasePreviewProps } from "./shared/preview-props"

export function GenericPreview({ componentKey, onClick }: BasePreviewProps) {
  const componentName = componentKey.replace(/([A-Z])/g, " $1").replace(/-/g, " ")

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <div className="group relative w-full h-full">
      <div className="text-xl font-semibold text-foreground transition-all group-hover:blur-sm">
        {componentName}
      </div>
      <div className="absolute inset-0 hidden group-hover:flex items-center justify-center">
        <Button
          variant="default"
          size="sm"
          onClick={handleButtonClick}
          className="pointer-events-auto"
        >
          Expand
        </Button>
      </div>
    </div>
  )
}
