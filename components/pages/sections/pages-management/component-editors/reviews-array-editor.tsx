"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, GripVertical, Star } from "lucide-react"
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

interface ReviewsArrayEditorProps {
  componentKey: string
  value: Array<{
    name: string
    stars: number
    review: string
    order: number
  }>
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

function SortableReviewItem({
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
    id: `review-${index}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [expanded, setExpanded] = useState(false)
  const stars = item.stars || 5

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
            {item.name || `Review ${index + 1}`}
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
            <Label>Name</Label>
            <Input
              value={item.name || ""}
              onChange={(e) => onUpdate({ ...item, name: e.target.value })}
              placeholder="Reviewer name"
            />
          </div>
          <div className="space-y-2">
            <Label>Stars Rating (1-5)</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => onUpdate({ ...item, stars: star })}
                  className={`
                    p-1 rounded transition-colors
                    ${stars >= star ? "text-yellow-500" : "text-gray-300"}
                  `}
                >
                  <Star className="h-5 w-5 fill-current" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Review</Label>
            <Textarea
              value={item.review || ""}
              onChange={(e) => onUpdate({ ...item, review: e.target.value })}
              placeholder="Review text"
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function ReviewsArrayEditor({
  value,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: ReviewsArrayEditorProps) {
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
      const oldIndex = items.findIndex((_, i) => `review-${i}` === active.id)
      const newIndex = items.findIndex((_, i) => `review-${i}` === over.id)

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
          <CardTitle className="text-sm">Reviews</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onArrayAdd?.("", {
                name: "",
                stars: 5,
                review: "",
                order: items.length + 1,
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Review
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((_, i) => `review-${i}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableReviewItem
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

