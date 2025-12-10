"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2 } from "lucide-react"
import { IconSelector } from "./shared/icon-selector"
import { ColorInput } from "./shared/color-input"

interface InfoCardWithBulletpointsEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

export function InfoCardWithBulletpointsEditor({
  value,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: InfoCardWithBulletpointsEditorProps) {
  const bulletpoints = Array.isArray(value?.bulletpoints) ? value.bulletpoints : []

  const handleBulletpointUpdate = (index: number, field: "text" | "showIcon", newValue: any) => {
    const updated = [...bulletpoints]
    updated[index] = { ...updated[index], [field]: newValue }
    onUpdate(["bulletpoints"], updated)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Info Card with Bulletpoints</CardTitle>
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
        <div className="space-y-4 border rounded p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Bulletpoints</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onArrayAdd?.("bulletpoints", {
                  text: "",
                  showIcon: true,
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Bulletpoint
            </Button>
          </div>
          <div className="space-y-2">
            {bulletpoints.map((bp: any, index: number) => (
              <div key={index} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Bulletpoint {index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onArrayRemove?.("bulletpoints", index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <Input
                  value={bp?.text || ""}
                  onChange={(e) => handleBulletpointUpdate(index, "text", e.target.value)}
                  placeholder="Bulletpoint text"
                />
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Icon</Label>
                  <Switch
                    checked={bp?.showIcon !== false}
                    onCheckedChange={(checked) => handleBulletpointUpdate(index, "showIcon", checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        {value?.bulletpointIcon && (
          <div className="space-y-4 border rounded p-4">
            <Label className="text-sm font-medium">Bulletpoint Icon</Label>
            <IconSelector
              label="Icon Source"
              value={value.bulletpointIcon?.src || ""}
              onChange={(path) => onUpdate(["bulletpointIcon", "src"], path)}
            />
            <ColorInput
              label="Icon Color"
              value={value.bulletpointIcon?.color || "accentColor1"}
              onChange={(color) => onUpdate(["bulletpointIcon", "color"], color)}
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

