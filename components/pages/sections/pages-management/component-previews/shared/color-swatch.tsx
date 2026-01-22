"use client"

import { cn } from "@/lib/utils"

interface ColorSwatchProps {
  colorValue: string | null
  onClick: (e: React.MouseEvent) => void
  className?: string
}

export function ColorSwatch({ colorValue, onClick, className }: ColorSwatchProps) {
  if (!colorValue) {
    return null
  }

  return (
    <div
      data-color-swatch
      onClick={onClick}
      className={cn(
        "w-12 h-12 rounded border-2 border-border cursor-pointer hover:scale-105 transition-transform flex-shrink-0",
        className
      )}
      style={{
        backgroundColor: colorValue.startsWith("#") ? colorValue : undefined,
      }}
      title={colorValue}
    />
  )
}
