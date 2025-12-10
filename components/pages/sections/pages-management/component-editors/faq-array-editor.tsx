"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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

interface FAQArrayEditorProps {
  componentKey: string
  value: Array<{ question: string; answer: string; order: number }>
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

function SortableFAQItem({
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
    id: `faq-${index}`,
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
          <Label className="text-sm">FAQ {index + 1}</Label>
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
            <Label>Question</Label>
            <Textarea
              value={item.question || ""}
              onChange={(e) => onUpdate({ ...item, question: e.target.value })}
              placeholder="Enter question"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Answer</Label>
            <Textarea
              value={item.answer || ""}
              onChange={(e) => onUpdate({ ...item, answer: e.target.value })}
              placeholder="Enter answer"
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function FAQArrayEditor({
  value,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: FAQArrayEditorProps) {
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
      const oldIndex = items.findIndex((_, i) => `faq-${i}` === active.id)
      const newIndex = items.findIndex((_, i) => `faq-${i}` === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      // Update order based on new index
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
          <CardTitle className="text-sm">FAQ Items</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onArrayAdd?.("", {
                question: "",
                answer: "",
                order: items.length + 1,
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add FAQ
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((_, i) => `faq-${i}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableFAQItem
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
