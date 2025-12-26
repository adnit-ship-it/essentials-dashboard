"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ColorInput } from "./shared/color-input"
import { usePagesStore } from "@/lib/stores/pages-store"

interface FeaturesArrayEditorProps {
  componentKey: string
  value: Array<{
    text: string
    iconType: string
    iconColor: string
  }>
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

function SortableFeatureItem({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: any
  index: number
  onUpdate: (updates: any) => void
  onRemove: () => void
}) {
  const { pagesData } = usePagesStore()
  const iconRegistry = pagesData?.iconRegistry || {}
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `feature-${index}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [expanded, setExpanded] = useState(false)

  return (
    <div ref={setNodeRef} style={style} className="border rounded p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
          <Label className="text-sm">
            {item.text || `Feature ${index + 1}`}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Collapse" : "Expand"}
          </Button>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 pt-2 border-t">
          <div className="space-y-2">
            <Label>Text</Label>
            <Input
              value={item.text || ""}
              onChange={(e) => onUpdate({ ...item, text: e.target.value })}
              placeholder="Feature text"
            />
          </div>
          <div className="space-y-2">
            <Label>Icon Type</Label>
            <Select
              value={item.iconType || ""}
              onValueChange={(iconType) => onUpdate({ ...item, iconType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select icon type" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(iconRegistry).map((key) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ColorInput
            label="Icon Color"
            value={item.iconColor || "#AA992C"}
            onChange={(iconColor) => onUpdate({ ...item, iconColor })}
          />
        </div>
      )}
    </div>
  )
}

export function FeaturesArrayEditor({
  value,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: FeaturesArrayEditorProps) {
  const items = Array.isArray(value) ? value : []

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((_, i) => `feature-${i}` === active.id)
      const newIndex = items.findIndex((_, i) => `feature-${i}` === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      onUpdate([], newItems)
    }
  }

  const handleItemUpdate = (index: number, updates: any) => {
    const updated = [...items]
    updated[index] = updates
    onUpdate([], updated)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Features</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onArrayAdd?.("", {
                text: "",
                iconType: "checkmark-star",
                iconColor: "#AA992C",
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Feature
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((_, i) => `feature-${i}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableFeatureItem
                  key={index}
                  item={item}
                  index={index}
                  onUpdate={(updates) => handleItemUpdate(index, updates)}
                  onRemove={() => onArrayRemove?.("", index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  )
}

