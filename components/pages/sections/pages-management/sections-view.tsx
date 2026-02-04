"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Eye, EyeOff, GripVertical, Layout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import {
  getSectionsForPage,
  reorderSections,
  updatePageSection,
} from "@/lib/utils/pages-helpers"
import { getSectionPreviewImagePath } from "@/lib/utils/section-preview-images"
import { cn } from "@/lib/utils"
import { useAnimationKey } from "@/lib/hooks/use-animation-key"
import { getStaggeredAnimationStyle } from "@/lib/utils/animation"
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
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface SortableSectionCardProps {
  section: any
  index: number
  templateName: string | null
  onToggleShow: (name: string) => void
  onSelectSection: (name: string) => void
}

function SortableSectionCard({
  section,
  index,
  templateName,
  onToggleShow,
  onSelectSection,
}: SortableSectionCardProps) {
  const [imageError, setImageError] = useState(false)
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.name,
  })

  const previewImagePath = getSectionPreviewImagePath(section.name, templateName)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    ...(getStaggeredAnimationStyle(index) as React.CSSProperties),
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons or drag handle
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest("[role='button']") ||
      target.closest("[data-drag-handle]")
    ) {
      return
    }
    onSelectSection(section.name)
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "w-full md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]",
        !isDragging && "animate-fade-in-staggered"
      )}
    >
      <Card 
        className={cn(
          "cursor-pointer hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] transition-all duration-200 overflow-hidden h-full flex flex-col"
        )}
        onClick={handleCardClick}
      >
        {/* Preview Image Area */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {previewImagePath && !imageError ? (
            <img
              src={previewImagePath}
              alt={`${section.name} preview`}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Layout className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          
          {/* Drag Handle - Overlay on top left */}
          <div
            {...attributes}
            {...listeners}
            data-drag-handle
            className="absolute top-2 left-2 p-1.5 rounded-md bg-background/80 backdrop-blur-sm cursor-grab active:cursor-grabbing hover:bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Card Content */}
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 flex-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{section.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                Component: {section.component || "None"}
              </p>
            </div>

            {/* Visibility Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onToggleShow(section.name)
              }}
              className={cn(
                "h-8 w-8 p-0 flex-shrink-0",
                !section.show && "text-muted-foreground"
              )}
              title={section.show ? "Hide section" : "Show section"}
            >
              {section.show ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
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
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [templateName, setTemplateName] = useState<string | null>(null)

  // Fetch templateName from hostTemplate.json
  useEffect(() => {
    if (repoOwnerFromLink && repoNameFromLink) {
      const apiUrl = typeof window !== "undefined" 
        ? "" // Relative URL in browser
        : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
      const url = `${apiUrl}/api/host-template?owner=${encodeURIComponent(repoOwnerFromLink)}&repo=${encodeURIComponent(repoNameFromLink)}`
      
      fetch(url)
        .then((res) => {
          if (res.ok) {
            return res.json()
          }
          if (res.status === 404) {
            return null
          }
          throw new Error(`Failed to fetch host template: ${res.status}`)
        })
        .then((data) => {
          if (data?.templateName) {
            setTemplateName(data.templateName)
          } else {
            setTemplateName(null)
          }
        })
        .catch((error) => {
          console.error("Error fetching host template:", error)
          setTemplateName(null)
        })
    }
  }, [repoOwnerFromLink, repoNameFromLink])

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

  // Generate animation key that changes when sections data changes
  const animationKey = useAnimationKey(sections, (section) => section.name)

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
          strategy={rectSortingStrategy}
        >
          <div key={animationKey} className="flex flex-wrap gap-4">
            {sections.map((section, index) => (
              <SortableSectionCard
                key={section.name}
                section={section}
                index={index}
                templateName={templateName}
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
