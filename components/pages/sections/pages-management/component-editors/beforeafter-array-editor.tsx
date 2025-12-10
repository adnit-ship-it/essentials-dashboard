"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Star } from "lucide-react"
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
import { ImageUpload } from "./shared/image-upload"

interface BeforeAfterArrayEditorProps {
  componentKey: string
  value: Array<{
    image: {
      src: string
      alt: string
      type: string
      stars?: number
      testimonial?: string
      name?: string
      order: number
    }
  }>
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

function SortableItem({
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
    id: `item-${index}`,
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
          <Label className="text-sm">Item {index + 1}</Label>
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
          <ImageUpload
            label="Image"
            value={item.image?.src || ""}
            onChange={(path) => onUpdate({ ...item, image: { ...item.image, src: path } })}
          />
          <div className="space-y-2">
            <Label>Alt Text</Label>
            <Input
              value={item.image?.alt || ""}
              onChange={(e) =>
                onUpdate({ ...item, image: { ...item.image, alt: e.target.value } })
              }
              placeholder="Image alt text"
            />
          </div>
          <div className="space-y-2">
            <Label>Stars Rating (1-5)</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    onUpdate({ ...item, image: { ...item.image, stars: star } })
                  }
                  className={`
                    p-1 rounded transition-colors
                    ${(item.image?.stars || 0) >= star ? "text-yellow-500" : "text-gray-300"}
                  `}
                >
                  <Star className="h-5 w-5 fill-current" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Testimonial</Label>
            <Textarea
              value={item.image?.testimonial || ""}
              onChange={(e) =>
                onUpdate({ ...item, image: { ...item.image, testimonial: e.target.value } })
              }
              placeholder="Testimonial text"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Reviewer Name</Label>
            <Input
              value={item.image?.name || ""}
              onChange={(e) =>
                onUpdate({ ...item, image: { ...item.image, name: e.target.value } })
              }
              placeholder="Reviewer name"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function BeforeAfterArrayEditor({
  value,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: BeforeAfterArrayEditorProps) {
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
      const oldIndex = items.findIndex((_, i) => `item-${i}` === active.id)
      const newIndex = items.findIndex((_, i) => `item-${i}` === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      // Update order based on new index
      const orderedItems = newItems.map((item, index) => ({
        ...item,
        image: { ...item.image, order: index + 1 },
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
          <CardTitle className="text-sm">Before/After Items</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onArrayAdd?.({
                image: {
                  src: "",
                  alt: "",
                  type: "image",
                  stars: 0,
                  testimonial: "",
                  name: "",
                  order: items.length + 1,
                },
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((_, i) => `item-${i}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableItem
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
