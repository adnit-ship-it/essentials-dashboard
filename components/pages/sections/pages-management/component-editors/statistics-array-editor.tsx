"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
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
import { IconSelector } from "./shared/icon-selector"
import { ImageUpload } from "./shared/image-upload"
import { ColorInput } from "./shared/color-input"

interface StatisticsArrayEditorProps {
  componentKey: string
  value: Array<{
    value: string
    description: string
    order: number
    icon: {
      src: string
      alt: string
      type: string
      color: string
    }
    showBulletpoint: boolean
    bulletpointText?: string
  }>
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

function SortableStatisticItem({
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
    id: `statistic-${index}`,
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
            {item.value || `Statistic ${index + 1}`}
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
            <Label>Value</Label>
            <Input
              value={item.value || ""}
              onChange={(e) => onUpdate({ ...item, value: e.target.value })}
              placeholder="Statistic value"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={item.description || ""}
              onChange={(e) => onUpdate({ ...item, description: e.target.value })}
              placeholder="Statistic description"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Icon (Select from Registry)</Label>
            <IconSelector
              label="Select from Registry"
              value={item.icon?.src || ""}
              onChange={(path) =>
                onUpdate({
                  ...item,
                  icon: {
                    ...item.icon,
                    src: path,
                    type: "svg-image",
                    color: item.icon?.color || "#337168",
                    alt: item.icon?.alt || "",
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Icon (Upload New)</Label>
            <ImageUpload
              label="Icon"
              value={item.icon?.src || ""}
              onChange={(path) =>
                onUpdate({
                  ...item,
                  icon: {
                    ...item.icon,
                    src: path,
                    type: "image",
                    color: item.icon?.color || "#337168",
                    alt: item.icon?.alt || "",
                  },
                })
              }
            />
          </div>
          {item.icon && (
            <ColorInput
              label="Icon Color"
              value={item.icon?.color || "#337168"}
              onChange={(color) =>
                onUpdate({
                  ...item,
                  icon: { ...item.icon, color },
                })
              }
            />
          )}
          <div className="flex items-center justify-between">
            <Label>Show Bulletpoint</Label>
            <Switch
              checked={item.showBulletpoint === true}
              onCheckedChange={(checked) => onUpdate({ ...item, showBulletpoint: checked })}
            />
          </div>
          {item.showBulletpoint && (
            <div className="space-y-2">
              <Label>Bulletpoint Text</Label>
              <Input
                value={item.bulletpointText || ""}
                onChange={(e) => onUpdate({ ...item, bulletpointText: e.target.value })}
                placeholder="Bulletpoint text"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function StatisticsArrayEditor({
  value,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: StatisticsArrayEditorProps) {
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
      const oldIndex = items.findIndex((_, i) => `statistic-${i}` === active.id)
      const newIndex = items.findIndex((_, i) => `statistic-${i}` === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      const orderedItems = newItems.map((item, index) => ({
        ...item,
        order: index + 1,
      }))
      onUpdate([], orderedItems)
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
          <CardTitle className="text-sm">Statistics</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onArrayAdd?.("", {
                value: "",
                description: "",
                order: items.length + 1,
                icon: {
                  src: "",
                  alt: "",
                  type: "svg-image",
                  color: "#337168",
                },
                showBulletpoint: false,
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Statistic
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((_, i) => `statistic-${i}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableStatisticItem
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

