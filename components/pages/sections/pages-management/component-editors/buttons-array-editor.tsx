"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { ColorInput } from "./shared/color-input"

interface ButtonsArrayEditorProps {
  componentKey: string
  value: Array<{
    text: string
    type: string
    color: string
    backgroundColor: string
    show: boolean
  }>
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

function SortableButtonItem({
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `button-${index}`,
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
          <div className="text-xs text-muted-foreground">⋮⋮</div>
          <Label className="text-sm">Button {index + 1}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
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
              placeholder="Button text"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Input
              value={item.type || "button"}
              onChange={(e) => onUpdate({ ...item, type: e.target.value })}
              placeholder="button"
            />
          </div>
          <ColorInput
            label="Text Color"
            value={item.color || "accentColor1"}
            onChange={(color) => onUpdate({ ...item, color })}
          />
          <ColorInput
            label="Background Color"
            value={item.backgroundColor || "accentColor1"}
            onChange={(color) => onUpdate({ ...item, backgroundColor: color })}
          />
          <div className="flex items-center justify-between">
            <Label>Show</Label>
            <Switch
              checked={item.show !== false}
              onCheckedChange={(checked) => onUpdate({ ...item, show: checked })}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function ButtonsArrayEditor({
  value,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: ButtonsArrayEditorProps) {
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
      const oldIndex = items.findIndex((_, i) => `button-${i}` === active.id)
      const newIndex = items.findIndex((_, i) => `button-${i}` === over.id)

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
          <CardTitle className="text-sm">Buttons</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onArrayAdd?.("", {
                text: "",
                type: "button",
                color: "accentColor1",
                backgroundColor: "accentColor1",
                show: true,
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Button
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((_, i) => `button-${i}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableButtonItem
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

