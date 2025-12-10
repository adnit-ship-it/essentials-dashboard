"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ColorInput } from "./shared/color-input"
import { Switch } from "@/components/ui/switch"

interface TextEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

export function TextEditor({
  componentKey,
  value,
  onUpdate,
}: TextEditorProps) {
  const text = value?.text || ""
  const color = value?.color || "bodyColor"
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
            onChange={(e) =>
              onUpdate(["text"], e.target.value)
            }
            placeholder="Enter text"
          />
        </div>

        <ColorInput
          label="Color"
          value={color}
          onChange={(newColor) => onUpdate(["color"], newColor)}
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

