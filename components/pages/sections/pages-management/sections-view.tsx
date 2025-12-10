"use client"

import { ChevronLeft, Eye, EyeOff, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePagesStore } from "@/lib/stores/pages-store"
import {
  getSectionsForPage,
  reorderSections,
  updatePageSection,
} from "@/lib/utils/pages-helpers"
import { cn } from "@/lib/utils"
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

function SortableSectionCard({
  section,
  index,
  onToggleShow,
  onSelectSection,
}: {
  section: any
  index: number
  onToggleShow: (name: string) => void
  onSelectSection: (name: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.name,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex-1">
                <CardTitle className="text-base">{section.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Component: {section.component || "None"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleShow(section.name)}
                className={cn("gap-2", !section.show && "text-muted-foreground")}
              >
                {section.show ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onSelectSection(section.name)}>
                Edit Components
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}

export function SectionsView() {
  const {
    pagesData,
    sectionsData,
    selectedPageKey,
    goBack,
    selectSection,
    updatePagesData,
  } = usePagesStore()

  if (!pagesData || !selectedPageKey) {
    goBack()
    return null
  }

  const page = pagesData[selectedPageKey] as any
  if (!page) {
    goBack()
    return null
  }

  const sections = getSectionsForPage(pagesData, selectedPageKey)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const sectionNames = sections.map((s) => s.name)
      const oldIndex = sectionNames.indexOf(active.id as string)
      const newIndex = sectionNames.indexOf(over.id as string)

      const newOrder = arrayMove(sectionNames, oldIndex, newIndex)
      updatePagesData((data) => reorderSections(data, selectedPageKey, newOrder))
    }
  }

  const handleToggleShow = (sectionName: string) => {
    const section = sections.find((s) => s.name === sectionName)
    if (!section) return

    updatePagesData((data) =>
      updatePageSection(data, selectedPageKey, sectionName, {
        show: !section.show,
      })
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Pages
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-md font-medium">Sections for "{page.title}"</h4>
          <p className="text-sm text-muted-foreground">
            {sections.length} section{sections.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.name)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.map((section, index) => (
              <SortableSectionCard
                key={section.name}
                section={section}
                index={index}
                onToggleShow={handleToggleShow}
                onSelectSection={selectSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

