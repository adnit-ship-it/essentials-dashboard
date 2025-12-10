"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ColorInput } from "./shared/color-input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface BadgeEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

export function BadgeEditor({ componentKey, value, onUpdate }: BadgeEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm capitalize">
          {componentKey.replace(/-/g, " ")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ColorInput
          label="Color"
          value={value?.color || "accentColor1"}
          onChange={(newColor) => onUpdate(["color"], newColor)}
        />
        <ColorInput
          label="Background Color"
          value={value?.backgroundColor || "accentColor1"}
          onChange={(newColor) => onUpdate(["backgroundColor"], newColor)}
        />
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

