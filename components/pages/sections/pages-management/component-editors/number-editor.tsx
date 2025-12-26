"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NumberEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

export function NumberEditor({
  componentKey,
  value,
  onUpdate,
}: NumberEditorProps) {
  // Set min/max for marqueeSpeed (50-200)
  const isMarqueeSpeed = componentKey === "marqueeSpeed"
  const min = isMarqueeSpeed ? 50 : undefined
  const max = isMarqueeSpeed ? 200 : undefined

  // Clamp initial value if it's outside the range
  const getClampedValue = (val: any): number => {
    let numValue = typeof val === 'number' ? val : Number(val) || 0
    if (isNaN(numValue)) {
      numValue = min !== undefined ? min : 0
    }
    if (min !== undefined && numValue < min) {
      numValue = min
    }
    if (max !== undefined && numValue > max) {
      numValue = max
    }
    return numValue
  }

  const clampedValue = getClampedValue(value)
  const displayValue = value === null || value === undefined ? (min !== undefined ? min : 0) : clampedValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Allow empty input while typing
    if (inputValue === '') {
      return
    }
    
    let numValue = Number(inputValue)
    
    // If invalid number, don't update
    if (isNaN(numValue)) {
      return
    }
    
    // Enforce min/max constraints
    if (min !== undefined && numValue < min) {
      numValue = min
    }
    if (max !== undefined && numValue > max) {
      numValue = max
    }
    
    onUpdate([], numValue)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    let numValue = inputValue === '' ? (min !== undefined ? min : 0) : Number(inputValue)
    
    // Handle invalid input
    if (isNaN(numValue)) {
      numValue = min !== undefined ? min : 0
    }
    
    // Enforce min/max constraints on blur
    if (min !== undefined && numValue < min) {
      numValue = min
    }
    if (max !== undefined && numValue > max) {
      numValue = max
    }
    
    onUpdate([], numValue)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm capitalize">
          {componentKey.replace(/([A-Z])/g, " $1")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Value</Label>
          <Input
            type="number"
            min={min}
            max={max}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {isMarqueeSpeed && (
            <p className="text-xs text-muted-foreground">
              Range: {min} - {max}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

