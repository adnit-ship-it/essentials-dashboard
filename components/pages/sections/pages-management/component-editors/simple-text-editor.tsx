"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SimpleTextEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

export function SimpleTextEditor({
  componentKey,
  value,
  onUpdate,
}: SimpleTextEditorProps) {
  const textValue = typeof value === "string" ? value : ""

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm capitalize">
          {componentKey.replace(/([A-Z])/g, " $1").replace(/-/g, " ")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Text</Label>
          <Input
            value={textValue}
            onChange={(e) => onUpdate([], e.target.value)}
            placeholder="Enter text"
          />
        </div>
      </CardContent>
    </Card>
  )
}

