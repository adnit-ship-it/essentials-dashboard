"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { isValidHex } from "@/lib/utils/colors"
import { usePagesStore } from "@/lib/stores/pages-store"

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  allowBrandColors?: boolean
}

const BRAND_COLORS = [
  { value: "bodyColor", label: "Body Color" },
  { value: "accentColor1", label: "Accent Color 1" },
  { value: "accentColor2", label: "Accent Color 2" },
  { value: "backgroundColor", label: "Background Color" },
]

export function ColorInput({
  label,
  value,
  onChange,
  allowBrandColors = true,
}: ColorInputProps) {
  const { pagesData } = usePagesStore()
  const [colorInput, setColorInput] = useState(value || "")
  const isBrandColor = BRAND_COLORS.some((bc) => bc.value === value)

  const handleColorPickerChange = (newValue: string) => {
    setColorInput(newValue.toUpperCase())
    onChange(newValue.toUpperCase())
  }

  const handleTextChange = (newValue: string) => {
    setColorInput(newValue)
    if (isValidHex(newValue)) {
      onChange(newValue.toUpperCase())
    }
  }

  const handleTextBlur = () => {
    if (!isValidHex(colorInput)) {
      setColorInput(value)
    }
  }

  const handleBrandColorSelect = (selectedValue: string) => {
    if (selectedValue === "custom") {
      // Switch back to custom hex mode
      // If we're currently in brand color mode, switch to a default hex value
      // The user can then edit it to their desired color
      if (isBrandColor) {
        // Use a default hex value when switching from brand color to custom
        const defaultHex = "#000000"
        onChange(defaultHex)
        setColorInput(defaultHex)
      }
      // If we're already in custom mode, do nothing
    } else {
      // A brand color was selected
      onChange(selectedValue)
      setColorInput("")
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={isBrandColor ? "#000000" : value || "#000000"}
          onChange={(e) => handleColorPickerChange(e.target.value)}
          className="h-10 w-12 cursor-pointer p-1"
          disabled={isBrandColor}
        />
        {allowBrandColors && (
          <Select value={isBrandColor ? value : "custom"} onValueChange={handleBrandColorSelect}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Brand color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom Hex</SelectItem>
              {BRAND_COLORS.map((bc) => (
                <SelectItem key={bc.value} value={bc.value}>
                  {bc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          value={isBrandColor ? "" : colorInput || value || ""}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleTextBlur}
          placeholder="#FFFFFF"
          className="flex-1"
          disabled={isBrandColor}
        />
        {isBrandColor && (
          <span className="text-xs text-muted-foreground self-center">
            {BRAND_COLORS.find((bc) => bc.value === value)?.label}
          </span>
        )}
      </div>
    </div>
  )
}

