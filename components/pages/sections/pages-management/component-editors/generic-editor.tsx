"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface GenericEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

export function GenericEditor({
  componentKey,
  value,
  onUpdate,
}: GenericEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm capitalize">
          {componentKey.replace(/([A-Z])/g, " $1").replace(/-/g, " ")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Value (JSON)</Label>
          <Textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                onUpdate([], parsed)
              } catch {
                // Invalid JSON, ignore
              }
            }}
            className="font-mono text-xs"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  )
}

