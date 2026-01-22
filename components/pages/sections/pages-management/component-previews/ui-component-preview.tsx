"use client"

import { getTextValue, getColorValueForDisplay } from "@/lib/utils/component-value-formatter"
import { ColorSwatch } from "./shared/color-swatch"
import type { BasePreviewProps } from "./shared/preview-props"

export function UIComponentPreview({ componentKey, value, onClick }: BasePreviewProps) {
  const textValue = getTextValue(value, componentKey) || componentKey
  const colorValue = getColorValueForDisplay(value, componentKey)

  const handleColorSwatchClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold line-clamp-1 text-foreground">
        {textValue}
      </div>
      {colorValue && (
        <ColorSwatch colorValue={colorValue} onClick={handleColorSwatchClick} />
      )}
    </div>
  )
}
