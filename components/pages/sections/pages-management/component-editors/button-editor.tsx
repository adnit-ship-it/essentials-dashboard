"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ColorInput } from "./shared/color-input"
import { Switch } from "@/components/ui/switch"

interface ButtonEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

export function ButtonEditor({
  componentKey,
  value,
  onUpdate,
}: ButtonEditorProps) {
  const text = value?.text || ""
  const color = value?.color || "accentColor1"
  const backgroundColor = value?.backgroundColor || ""
  const show = value?.show !== false

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm capitalize">
          {componentKey.replace(/([A-Z])/g, " $1")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Text</Label>
          <Input
            value={text}
            onChange={(e) => onUpdate(["text"], e.target.value)}
            placeholder="Button text"
          />
        </div>

        <ColorInput
          label="Text Color"
          value={color}
          onChange={(newColor) => onUpdate(["color"], newColor)}
        />

        <ColorInput
          label="Background Color"
          value={backgroundColor}
          onChange={(newColor) => onUpdate(["backgroundColor"], newColor)}
        />

        <div className="flex items-center justify-between">
          <Label>Show</Label>
          <Switch
            checked={show}
            onCheckedChange={(checked) => onUpdate(["show"], checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

