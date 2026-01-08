"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import type { RenderCondition, ConditionOperator, LogicalOperator } from "@/lib/types/quiz"

interface ConditionalRenderingEditorProps {
  condition: RenderCondition | null
  availableFields: Array<{ id: string; slug: string; question: string }>
  onChange: (condition: RenderCondition | null) => void
}

export function ConditionalRenderingEditor({
  condition,
  availableFields,
  onChange,
}: ConditionalRenderingEditorProps) {
  const [localCondition, setLocalCondition] = useState<RenderCondition>(
    condition || {
      conditions: [],
      logicalOperator: "AND",
    }
  )

  const handleAddCondition = () => {
    setLocalCondition({
      ...localCondition,
      conditions: [
        ...localCondition.conditions,
        {
          field: availableFields[0]?.slug || "",
          operator: "equals",
          value: "",
        },
      ],
    })
  }

  const handleRemoveCondition = (index: number) => {
    const newConditions = localCondition.conditions.filter((_, i) => i !== index)
    setLocalCondition({
      ...localCondition,
      conditions: newConditions,
    })
  }

  const handleUpdateCondition = (
    index: number,
    field: "field" | "operator" | "value",
    value: any
  ) => {
    const newConditions = [...localCondition.conditions]
    newConditions[index] = {
      ...newConditions[index],
      [field]: value,
    }
    setLocalCondition({
      ...localCondition,
      conditions: newConditions,
    })
  }

  const handleSave = () => {
    if (localCondition.conditions.length === 0) {
      onChange(null)
    } else {
      onChange(localCondition)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conditional Rendering</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Logical Operator</Label>
          <Select
            value={localCondition.logicalOperator}
            onValueChange={(value: LogicalOperator) =>
              setLocalCondition({
                ...localCondition,
                logicalOperator: value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND (all conditions must be true)</SelectItem>
              <SelectItem value="OR">OR (any condition must be true)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Conditions</Label>
          {localCondition.conditions.map((cond, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Select
                  value={cond.field}
                  onValueChange={(value) =>
                    handleUpdateCondition(index, "field", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map((field) => (
                      <SelectItem key={field.id} value={field.slug}>
                        {field.question}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Select
                  value={cond.operator}
                  onValueChange={(value: ConditionOperator) =>
                    handleUpdateCondition(index, "operator", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">equals</SelectItem>
                    <SelectItem value="notEquals">not equals</SelectItem>
                    <SelectItem value="greaterThan">greater than</SelectItem>
                    <SelectItem value="lessThan">less than</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Input
                  value={cond.value}
                  onChange={(e) =>
                    handleUpdateCondition(index, "value", e.target.value)
                  }
                  placeholder="Value"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveCondition(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" onClick={handleAddCondition} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Conditions</Button>
        </div>
      </CardContent>
    </Card>
  )
}




