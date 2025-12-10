"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { IconSelector } from "./shared/icon-selector"
import { ColorInput } from "./shared/color-input"

interface InfoCardEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

export function InfoCardEditor({ value, onUpdate }: InfoCardEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Info Card</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={value?.title || ""}
            onChange={(e) => onUpdate(["title"], e.target.value)}
            placeholder="Card title"
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={value?.description || ""}
            onChange={(e) => onUpdate(["description"], e.target.value)}
            placeholder="Card description"
            rows={4}
          />
        </div>
        {value?.icon && (
          <div className="space-y-4 border rounded p-4">
            <Label className="text-sm font-medium">Icon</Label>
            <IconSelector
              label="Icon Source"
              value={value.icon?.src || ""}
              onChange={(path) => onUpdate(["icon", "src"], path)}
            />
            <div className="space-y-2">
              <Label>Icon Type</Label>
              <Input
                value={value.icon?.type || "svg-image"}
                onChange={(e) => onUpdate(["icon", "type"], e.target.value)}
                placeholder="svg-image"
              />
            </div>
            <ColorInput
              label="Icon Color"
              value={value.icon?.color || "accentColor1"}
              onChange={(color) => onUpdate(["icon", "color"], color)}
            />
          </div>
        )}
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

