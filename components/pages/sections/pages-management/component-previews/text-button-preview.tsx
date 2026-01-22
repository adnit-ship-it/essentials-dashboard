"use client"

import { getTextValue, getColorValueForDisplay } from "@/lib/utils/component-value-formatter"
import { ColorSwatch } from "./shared/color-swatch"
import type { BasePreviewProps } from "./shared/preview-props"

export function TextButtonPreview({ componentKey, value, onClick }: BasePreviewProps) {
  const textValue = getTextValue(value, componentKey)
  const colorValue = getColorValueForDisplay(value, componentKey)

  const handleColorSwatchClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <div className="space-y-3 flex flex-col items-center justify-center">
      {textValue && (
        <div className="text-2xl font-semibold line-clamp-1 text-foreground">
          {textValue}
        </div>
      )}
      {colorValue && (
        <ColorSwatch colorValue={colorValue} onClick={handleColorSwatchClick} />
      )}
    </div>
  )
}
