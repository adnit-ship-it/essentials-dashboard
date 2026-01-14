"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CalculatedValuesEditorProps {
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
  disabled?: boolean
}

export function CalculatedValuesEditor({
  value,
  onChange,
  disabled = false,
}: CalculatedValuesEditorProps) {
  const [localValues, setLocalValues] = useState<Array<{ key: string; val: string }>>(() => {
    return Object.entries(value || {}).map(([key, val]) => ({ key, val }))
  })

  const handleAdd = () => {
    const newValues = [...localValues, { key: "", val: "" }]
    setLocalValues(newValues)
    updateParent(newValues)
  }

  const handleRemove = (index: number) => {
    const newValues = localValues.filter((_, i) => i !== index)
    setLocalValues(newValues)
    updateParent(newValues)
  }

  const handleUpdate = (index: number, field: "key" | "val", newValue: string) => {
    const newValues = [...localValues]
    newValues[index] = { ...newValues[index], [field]: newValue }
    setLocalValues(newValues)
    updateParent(newValues)
  }

  const updateParent = (values: Array<{ key: string; val: string }>) => {
    const record: Record<string, string> = {}
    values.forEach((item) => {
      if (item.key.trim()) {
        record[item.key.trim()] = item.val.trim()
      }
    })
    onChange(record)
  }

  const hasDuplicateKeys = () => {
    const keys = localValues.map((v) => v.key.trim()).filter((k) => k)
    return new Set(keys).size !== keys.length
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Calculated Values</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Value
        </Button>
      </div>

      {localValues.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No calculated values. Click "Add Value" to create key-value pairs.
        </p>
      ) : (
        <div className="space-y-2">
          {localValues.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Key</Label>
                      <Input
                        value={item.key}
                        onChange={(e) => handleUpdate(index, "key", e.target.value)}
                        placeholder="e.g., bmi"
                        disabled={disabled}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Value</Label>
                      <Input
                        value={item.val}
                        onChange={(e) => handleUpdate(index, "val", e.target.value)}
                        placeholder="e.g., 25.5"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    disabled={disabled || localValues.length === 1}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasDuplicateKeys() && (
        <p className="text-sm text-destructive">
          Warning: Duplicate keys detected. Each key must be unique.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Add calculated values that will be displayed in the medical review question (e.g., BMI, currentWeight, weeksToGoal).
      </p>
    </div>
  )
}
