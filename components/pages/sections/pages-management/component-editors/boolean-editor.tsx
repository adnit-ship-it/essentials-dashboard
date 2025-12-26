"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface BooleanEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

export function BooleanEditor({
  componentKey,
  value,
  onUpdate,
}: BooleanEditorProps) {
  const boolValue = value === true || value === "true"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm capitalize">
          {componentKey.replace(/([A-Z])/g, " $1").replace(/-/g, " ")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label>Value</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={boolValue}
              onCheckedChange={(checked) => onUpdate([], checked)}
            />
            <span className="text-sm text-muted-foreground">
              {boolValue ? "On" : "Off"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

