"use client"

import { GripVertical, Eye, EyeOff, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePagesStore } from "@/lib/stores/pages-store"
import { reorderPages, updatePage, getPageKeys } from "@/lib/utils/pages-helpers"
import type { PageKey } from "@/lib/types/pages"
import { useState } from "react"
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

interface PagesViewProps {
  pages: Array<{ key: PageKey; page: any }>
}

function SortablePageCard({
  page,
  pageKey,
  index,
  editingPage,
  editTitle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onSetEditTitle,
  onToggleShow,
  onSelectPage,
}: any) {
  const isHomePage = pageKey.toLowerCase() === "home" || page.title?.toLowerCase() === "home"
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pageKey,
    disabled: isHomePage,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div
              {...attributes}
              {...listeners}
              className={cn(
                isHomePage ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing"
              )}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex-1">
              {editingPage === pageKey ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => onSetEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSaveEdit()
                      if (e.key === "Escape") onCancelEdit()
                    }}
                    className="h-8"
                    autoFocus
                  />
                  <Button size="sm" onClick={onSaveEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{page.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStartEdit(pageKey)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {page.description || "No description"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleShow(pageKey)}
                className={cn("gap-2", !page.show && "text-muted-foreground")}
              >
                {page.show ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onSelectPage(pageKey)}>
                View Sections
              </Button>
            </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      )
    }

export function PagesView({ pages }: PagesViewProps) {
  const { pagesData, selectPage, updatePagesData } = usePagesStore()
  const [editingPage, setEditingPage] = useState<PageKey | null>(null)
  const [editTitle, setEditTitle] = useState("")

  if (!pagesData) return null

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const pageKeys = getPageKeys(pagesData)
      const activeKey = active.id as PageKey
      const overKey = over.id as PageKey
      
      // Prevent moving Home page
      const activePage = pagesData[activeKey] as any
      const isHomeActive = activeKey.toLowerCase() === "home" || activePage?.title?.toLowerCase() === "home"
      
      if (isHomeActive) {
        return // Don't allow Home page to be moved
      }
      
      // Prevent moving other pages before Home
      const homeKey = pageKeys.find(key => {
        const page = pagesData[key] as any
        return key.toLowerCase() === "home" || page?.title?.toLowerCase() === "home"
      })
      
      if (homeKey) {
        const homeIndex = pageKeys.indexOf(homeKey)
        const newIndex = pageKeys.indexOf(overKey)
        
        // Don't allow moving anything to position 0 (before Home)
        if (newIndex === 0) {
          return
        }
      }

      const oldIndex = pageKeys.indexOf(activeKey)
      const newIndex = pageKeys.indexOf(overKey)

      const newOrder = arrayMove(pageKeys, oldIndex, newIndex)
      updatePagesData((data) => reorderPages(data, newOrder))
    }
  }

  const handleToggleShow = (pageKey: PageKey) => {
    const page = pagesData[pageKey] as any
    if (!page) return

    updatePagesData((data) =>
      updatePage(data, pageKey, { show: !page.show })
    )
  }

  const handleStartEdit = (pageKey: PageKey) => {
    const page = pagesData[pageKey] as any
    if (page) {
      setEditingPage(pageKey)
      setEditTitle(page.title)
    }
  }

  const handleSaveEdit = () => {
    if (!editingPage) return
    updatePagesData((data) =>
      updatePage(data, editingPage, { title: editTitle })
    )
    setEditingPage(null)
    setEditTitle("")
  }

  const handleCancelEdit = () => {
    setEditingPage(null)
    setEditTitle("")
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium">Pages</h4>
          <p className="text-sm text-muted-foreground">
            {pages.length} page{pages.length !== 1 ? "s" : ""}
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pages.map((p) => p.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {pages.map(({ key, page }, index) => (
                <SortablePageCard
                  key={key}
                  page={page}
                  pageKey={key}
                  index={index}
                  editingPage={editingPage}
                  editTitle={editTitle}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onSetEditTitle={setEditTitle}
                  onToggleShow={handleToggleShow}
                  onSelectPage={selectPage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </>
  )
}

