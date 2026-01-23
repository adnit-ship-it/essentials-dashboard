"use client"

import { Button } from "@/components/ui/button"
import { getCardTitle, getColorValueForDisplay } from "@/lib/utils/component-value-formatter"
import { ColorSwatch } from "./shared/color-swatch"
import { formatComponentNameForEdit } from "./shared/format-component-name"
import type { BasePreviewProps } from "./shared/preview-props"

export function CardPreview({ componentKey, value, onClick }: BasePreviewProps) {
  const title = getCardTitle(value, componentKey)
  const colorValue = getColorValueForDisplay(value, componentKey)
  const componentName = formatComponentNameForEdit(componentKey)

  const handleColorSwatchClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <div className="group relative w-full h-full flex flex-col items-center justify-center cursor-pointer rounded-md">
      {/* Content wrapper with blur on hover */}
      <div className="space-y-3 transition-all group-hover:blur-sm" onClick={onClick}>
        <div className="text-xl font-semibold line-clamp-1 text-foreground">
          {title}
        </div>
        {colorValue && (
          <ColorSwatch colorValue={colorValue} onClick={handleColorSwatchClick} />
        )}
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
