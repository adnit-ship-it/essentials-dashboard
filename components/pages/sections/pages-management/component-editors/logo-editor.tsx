"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import { LogoSelector } from "./shared/logo-selector"
import { isValidHeight, formatHeight } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"

interface LogoEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

// Height input with increment/decrement buttons
function HeightInput({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  error?: string
}) {
  const parseValue = (val: string): number => {
    const num = parseInt(val.replace("px", "").trim())
    return isNaN(num) ? 0 : num
  }

  const formatValue = (num: number): string => {
    return `${num}px`
  }

  const handleIncrement = () => {
    const current = parseValue(value || "0px")
    onChange(formatValue(current + 1))
  }

  const handleDecrement = () => {
    const current = parseValue(value || "0px")
    if (current > 0) {
      onChange(formatValue(current - 1))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Allow empty input while typing
    if (inputValue === "") {
      onChange("")
      return
    }
    // Validate and format
    if (isValidHeight(inputValue)) {
      onChange(formatHeight(inputValue))
    } else {
      onChange(inputValue) // Allow typing, validation happens on blur
    }
  }

  const handleBlur = () => {
    if (value && !isValidHeight(value)) {
      // Try to fix common issues
      const num = parseValue(value)
      if (num > 0) {
        onChange(formatValue(num))
      }
    }
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleDecrement}
          disabled={parseValue(value || "0px") <= 0}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "text-center",
            error ? "border-red-500" : ""
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleIncrement}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export function LogoEditor({ componentKey, value, onUpdate }: LogoEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Logo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LogoSelector
          label="Select from Registry"
          value={value?.src || ""}
          onChange={(path) => onUpdate(["src"], path)}
        />
        <div className="space-y-2">
          <Label>Alt Text</Label>
          <Input
            value={value?.alt || ""}
            onChange={(e) => onUpdate(["alt"], e.target.value)}
            placeholder="Logo alt text"
          />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <div className="text-sm text-muted-foreground py-2 px-3 rounded-md border bg-muted/50">
            {value?.type || "svg-image"}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label>Show</Label>
          <Switch
            checked={value?.show !== false}
            onCheckedChange={(checked) => onUpdate(["show"], checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

