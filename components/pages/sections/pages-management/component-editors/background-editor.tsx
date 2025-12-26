"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ColorInput } from "./shared/color-input"

interface BackgroundEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

export function BackgroundEditor({
  componentKey,
  value,
  onUpdate,
}: BackgroundEditorProps) {
  const color = value?.color || "white"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm capitalize">
          {componentKey.replace(/([A-Z])/g, " $1")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ColorInput
          label="Background Color"
          value={color}
          onChange={(newColor) => onUpdate(["color"], newColor)}
        />
      </CardContent>
    </Card>
  )
}

