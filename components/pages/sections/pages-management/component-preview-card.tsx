"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import type { EditorType } from "./component-mapper"
import {
  getTextValue,
  getColorValueForDisplay,
  getImageSource,
  getArrayDisplayText,
  getCardTitle,
  isMediaComponent,
  isGenericComponent,
  getArrayCount,
} from "@/lib/utils/component-value-formatter"
import { cn } from "@/lib/utils"

interface ComponentPreviewCardProps {
  componentKey: string
  value: any
  componentIndex: number
  editorType: EditorType
  onClick: () => void
  onShowToggle: (checked: boolean) => void
  show: boolean
}

export function ComponentPreviewCard({
  componentKey,
  value,
  editorType,
  onClick,
  onShowToggle,
  show,
}: ComponentPreviewCardProps) {
  const [imageError, setImageError] = useState(false)

  // Get show value from the value object if it exists
  const showValue = typeof value === "object" && value !== null && !Array.isArray(value)
    ? value.show !== false
    : show

  const handleShowToggle = (checked: boolean) => {
    onShowToggle(checked)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on the switch or color swatch
    if (
      (e.target as HTMLElement).closest('[role="switch"]') ||
      (e.target as HTMLElement).closest('[data-color-swatch]')
    ) {
      return
    }
    onClick()
  }

  const handleColorSwatchClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  // Render based on editor type
  const renderContent = () => {
    // Text/Button Components
    if (editorType === "text" || editorType === "button") {
      const textValue = getTextValue(value, componentKey)
      const colorValue = getColorValueForDisplay(value, componentKey)

      return (
        <div className="space-y-3 bg-red-200 flex flex-col items-center justify-center">
          {textValue && (
            <div className="text-2xl font-semibold line-clamp-1 text-foreground">
              {textValue}
            </div>
          )}
          {colorValue && (
            <div
              data-color-swatch
              onClick={handleColorSwatchClick}
              className="w-12 h-12 rounded border-2 border-border cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
              style={{
                backgroundColor: colorValue.startsWith("#") ? colorValue : undefined,
              }}
              title={colorValue}
            />
          )}
        </div>
      )
    }

    // Button Arrays
    if (editorType === "buttons") {
      const count = getArrayCount(value)
      return (
        <div className="text-xl bg-blue-200 font-semibold text-foreground">
          {count} Button{count !== 1 ? "s" : ""}
        </div>
      )
    }

    // Media Components (logo, logos, media)
    if (isMediaComponent(editorType)) {
      const imageSrc = getImageSource(value)
      const isArray = Array.isArray(value)
      const count = isArray ? value.length : 0
      const remainingCount = isArray && count > 0 ? count - 1 : 0

      if (imageSrc && !imageError) {
        return (
          <div className="group relative w-full h-full bg-green-200 ">
            <div className="w-full h-full overflow-hidden rounded-md">
              <img
                src={imageSrc}
                alt={componentKey}
                className="w-full h-full object-cover transition-all group-hover:blur-sm"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onClick()
                }}
                className="pointer-events-auto"
              >
                {remainingCount > 0 ? `${remainingCount} more ${componentKey === "logos" ? "logos" : "images"}` : "Update Media"}
              </Button>
            </div>
          </div>
        )
      }

      // Fallback if no image
      return (
        <div className="text-xl font-semibold text-foreground">
          {isArray ? `${count} ${componentKey === "logos" ? "Logos" : "Images"}` : "No Image"}
        </div>
      )
    }

    // Content Arrays (bulletPoints, steps, faq, features, reviews, statistics)
    if (
      editorType === "bulletPoints" ||
      editorType === "steps" ||
      editorType === "faq" ||
      editorType === "features" ||
      editorType === "reviews" ||
      editorType === "statistics"
    ) {
      const displayText = getArrayDisplayText(value, componentKey)
      return (
        <div className="text-xl font-semibold text-foreground">
          {displayText || "0 items"}
        </div>
      )
    }

    // Before-After Array (show first image + count)
    if (editorType === "before-after") {
      const imageSrc = getImageSource(value)
      const count = getArrayCount(value)
      const remainingCount = count > 0 ? count - 1 : 0

      if (imageSrc && !imageError) {
        return (
          <div className="group relative w-full h-full">
            <div className="w-full h-full overflow-hidden rounded-md">
              <img
                src={imageSrc}
                alt="Before/After"
                className="w-full h-full object-cover transition-all group-hover:blur-sm"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            </div>
            {remainingCount > 0 && (
              <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClick()
                  }}
                  className="pointer-events-auto"
                >
                  {remainingCount} more
                </Button>
              </div>
            )}
          </div>
        )
      }

      return (
        <div className="text-xl font-semibold text-foreground">
          {count} Before/After{count !== 1 ? "s" : ""}
        </div>
      )
    }

    // Card Components (productCard, infoCard, infoCardWithBulletpoints, stats)
    if (
      editorType === "productCard" ||
      editorType === "infoCard" ||
      editorType === "infoCardWithBulletpoints" ||
      editorType === "stats"
    ) {
      const title = getCardTitle(value, componentKey)
      const colorValue = getColorValueForDisplay(value, componentKey)

      return (
        <div className="space-y-3">
          <div className="text-xl font-semibold line-clamp-1 text-foreground">
            {title}
          </div>
          {colorValue && (
            <div
              data-color-swatch
              onClick={handleColorSwatchClick}
              className="w-12 h-12 rounded border-2 border-border cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
              style={{
                backgroundColor: colorValue.startsWith("#") ? colorValue : undefined,
              }}
              title={colorValue}
            />
          )}
        </div>
      )
    }

    // UI Components (badge, background)
    if (editorType === "badge" || editorType === "background") {
      const textValue = getTextValue(value, componentKey) || componentKey
      const colorValue = getColorValueForDisplay(value, componentKey)

      return (
        <div className="space-y-3">
          <div className="text-xl font-semibold line-clamp-1 text-foreground">
            {textValue}
          </div>
          {colorValue && (
            <div
              data-color-swatch
              onClick={handleColorSwatchClick}
              className="w-12 h-12 rounded border-2 border-border cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
              style={{
                backgroundColor: colorValue.startsWith("#") ? colorValue : undefined,
              }}
              title={colorValue}
            />
          )}
        </div>
      )
    }

    // Simple Components - Number
    if (editorType === "number") {
      const numValue = typeof value === "number" ? value : (typeof value === "string" ? parseFloat(value) : 0)
      return (
        <div className="text-3xl font-bold text-foreground">
          {isNaN(numValue) ? "—" : numValue}
        </div>
      )
    }

    // Simple Components - Boolean
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

    // Simple Components - SimpleText
    if (editorType === "simpleText") {
      const textValue = typeof value === "string" ? value : (value?.text || "")
      return (
        <div className="text-xl font-semibold line-clamp-1 text-foreground">
          {textValue || "—"}
        </div>
      )
    }

    // Generic/Fallback
    if (isGenericComponent(editorType)) {
      const componentName = componentKey.replace(/([A-Z])/g, " $1").replace(/-/g, " ")
      return (
        <div className="group relative w-full h-full">
          <div className="text-xl font-semibold text-foreground transition-all group-hover:blur-sm">
            {componentName}
          </div>
          <div className="absolute inset-0 hidden group-hover:flex items-center justify-center">
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
              className="pointer-events-auto"
            >
              Expand
            </Button>
          </div>
        </div>
      )
    }

    // Default fallback
    return (
      <div className="text-sm text-foreground">
        {componentKey}
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md aspect-square",
        "flex flex-col h-full"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm capitalize line-clamp-1">
            {componentKey.replace(/([A-Z])/g, " $1").replace(/-/g, " ")}
          </CardTitle>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2"
          >
            <Label htmlFor={`show-${componentKey}`} className="text-xs text-muted-foreground">
              Show
            </Label>
            <Switch
              id={`show-${componentKey}`}
              checked={showValue}
              onCheckedChange={handleShowToggle}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center overflow-hidden p-4">
        {renderContent()}
      </CardContent>
    </Card>
  )
}
