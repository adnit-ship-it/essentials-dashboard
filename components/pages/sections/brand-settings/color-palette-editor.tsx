"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BrandingColors } from "@/lib/types/branding"
import { isValidHex } from "@/lib/utils/colors"

interface ColorPaletteEditorProps {
  colors: BrandingColors
  onColorsChange: (colors: BrandingColors) => void
}

export function ColorPaletteEditor({
  colors,
  onColorsChange,
}: ColorPaletteEditorProps) {
  const handleColorPickerChange = (key: keyof BrandingColors, value: string) => {
    onColorsChange({
      ...colors,
      [key]: value.toUpperCase(),
    })
  }

  const handleColorTextChange = (key: keyof BrandingColors, value: string) => {
    if (isValidHex(value)) {
      onColorsChange({
        ...colors,
        [key]: value.toUpperCase(),
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Palette</CardTitle>
        <CardDescription>
          Adjust the fallback colors used throughout the product.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(colors) as Array<keyof BrandingColors>).map((key) => (
            <div key={key} className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">
                {key.replace(/([A-Z])/g, " $1")}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={colors[key]}
                  onChange={(e) => handleColorPickerChange(key, e.target.value)}
                  className="h-10 w-12 cursor-pointer p-1"
                />
                <Input
                  value={colors[key]}
                  onChange={(e) => handleColorTextChange(key, e.target.value)}
                  placeholder="#FFFFFF"
                  className="max-w-32"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}




