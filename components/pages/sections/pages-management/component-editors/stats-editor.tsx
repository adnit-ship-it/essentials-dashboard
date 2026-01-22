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

interface StatsEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

function SortableStatCard({
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
    id: `stat-card-${index}`,
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
            {item.value || `Stat Card ${index + 1}`}
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
              placeholder="Statistic value (e.g., 14.9%)"
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
        </div>
      )}
    </div>
  )
}

export function StatsEditor({
  value,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: StatsEditorProps) {
  const show = value?.show !== false
  const cards = Array.isArray(value?.cards) ? value.cards : []

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex((_item: any, i: number) => `stat-card-${i}` === active.id)
      const newIndex = cards.findIndex((_item: any, i: number) => `stat-card-${i}` === over.id)

      const newCards = arrayMove(cards, oldIndex, newIndex)
      onUpdate(["cards"], newCards)
    }
  }

  const handleItemUpdate = (index: number, updates: any) => {
    const updated = [...cards]
    updated[index] = updates
    onUpdate(["cards"], updated)
  }

  const handleAddCard = () => {
    const newCard = {
      value: "",
      description: "",
    }
    const updatedCards = [...cards, newCard]
    onUpdate(["cards"], updatedCards)
  }

  const handleRemoveCard = (index: number) => {
    const updatedCards = cards.filter((_item: any, i: number) => i !== index)
    onUpdate(["cards"], updatedCards)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Statistics</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddCard}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Stat Card
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Show</Label>
          <Switch
            checked={show}
            onCheckedChange={(checked) => onUpdate(["show"], checked)}
          />
        </div>

        <div className="space-y-2">
          <Label>Cards</Label>
          {cards.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4 border rounded">
              No stat cards. Click "Add Stat Card" to add one.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={cards.map((_item: any, i: number) => `stat-card-${i}`)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {cards.map((item: any, index: number) => (
                    <SortableStatCard
                      key={index}
                      item={item}
                      index={index}
                      onUpdate={(updates) => handleItemUpdate(index, updates)}
                      onRemove={() => handleRemoveCard(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
