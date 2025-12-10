"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Plus, X } from "lucide-react"
import { ColorInput } from "./shared/color-input"
import { IconSelector } from "./shared/icon-selector"

interface BulletPointsEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

export function BulletPointsEditor({
  value,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: BulletPointsEditorProps) {
  const items = value?.items || []
  const show = value?.show !== false
  const iconSrc = value?.icon?.src || ""
  const iconColor = value?.icon?.color || "accentColor1"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Bullet Points</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Show</Label>
          <Switch
            checked={show}
            onCheckedChange={(checked) => onUpdate(["show"], checked)}
          />
        </div>

        <IconSelector
          label="Icon"
          value={iconSrc}
          onChange={(path) => onUpdate(["icon", "src"], path)}
        />

        <ColorInput
          label="Icon Color"
          value={iconColor}
          onChange={(newColor) => onUpdate(["icon", "color"], newColor)}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Items</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onArrayAdd?.("items", "")}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
          <div className="space-y-2">
            {items.map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const newItems = [...items]
                    newItems[index] = e.target.value
                    onUpdate(["items"], newItems)
                  }}
                  placeholder="Bullet point text"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onArrayRemove?.("items", index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

