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
            value={value || 0}
            onChange={(e) => onUpdate([], Number(e.target.value))}
          />
        </div>
      </CardContent>
    </Card>
  )
}

