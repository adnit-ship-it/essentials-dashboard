"use client"

import { getCardTitle, getColorValueForDisplay } from "@/lib/utils/component-value-formatter"
import { ColorSwatch } from "./shared/color-swatch"
import type { BasePreviewProps } from "./shared/preview-props"

export function CardPreview({ componentKey, value, onClick }: BasePreviewProps) {
  const title = getCardTitle(value, componentKey)
  const colorValue = getColorValueForDisplay(value, componentKey)

  const handleColorSwatchClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold line-clamp-1 text-foreground">
        {title}
      </div>
      {colorValue && (
        <ColorSwatch colorValue={colorValue} onClick={handleColorSwatchClick} />
      )}
    </div>
  )
}
