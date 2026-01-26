"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { IconSelector } from "./shared/icon-selector"
import { ImageUpload } from "./shared/image-upload"

interface StepsArrayEditorProps {
  componentKey: string
  value: Array<{
    title: string
    subtext: string
    icon: { src: string; alt: string; type: string; color: string }
    order: number
  }>
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

function SortableStepItem({
  item,
  index,
  onUpdate,
  onRemove,
  shouldExpand,
}: {
  item: any
  index: number
  onUpdate: (updates: any) => void
  onRemove: () => void
  shouldExpand?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `step-${index}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [expanded, setExpanded] = useState(shouldExpand || false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (shouldExpand && !expanded) {
      setExpanded(true)
    }
    if (expanded && shouldExpand && titleInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 100)
    }
  }, [shouldExpand, expanded])

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
            {item.title || item.subtext || `Step ${index + 1}`}
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
            <Label>Title</Label>
            <Input
              ref={titleInputRef}
              value={item.title || ""}
              onChange={(e) => onUpdate({ ...item, title: e.target.value })}
              placeholder="Step title"
            />
          </div>
          <div className="space-y-2">
            <Label>Subtext</Label>
            <Textarea
              value={item.subtext || ""}
              onChange={(e) => onUpdate({ ...item, subtext: e.target.value })}
              placeholder="Step description"
              rows={2}
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
                  icon: { ...item.icon, src: path, type: "svg-image", color: item.icon?.color || "accentColor1" },
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
                  icon: { ...item.icon, src: path, type: "image", color: item.icon?.color || "accentColor1" },
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function StepsArrayEditor({
  value,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: StepsArrayEditorProps) {
  const items = Array.isArray(value) ? value : []
  const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((_, i) => `step-${i}` === active.id)
      const newIndex = items.findIndex((_, i) => `step-${i}` === over.id)

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

  const handleAdd = () => {
    const newIndex = items.length
    setNewlyAddedIndex(newIndex)
    onArrayAdd?.("", {
      title: "",
      subtext: "",
      icon: { src: "", alt: "", type: "svg-image", color: "accentColor1" },
      order: items.length + 1,
    })
    // Clear the newly added index after a short delay
    setTimeout(() => setNewlyAddedIndex(null), 500)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Steps</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Step
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((_, i) => `step-${i}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableStepItem
                  key={index}
                  item={item}
                  index={index}
                  onUpdate={(updates) => handleItemUpdate(index, updates)}
                  onRemove={() => onArrayRemove?.("", index)}
                  shouldExpand={newlyAddedIndex === index}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  )
}
