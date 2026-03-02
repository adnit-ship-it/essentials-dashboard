"use client"

import { useState } from "react"
import { GripVertical, Eye, EyeOff, Edit2, ExternalLink, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useRepoAppDataStore } from "@/lib/stores/repo-app-data-store"
import { reorderPages, updatePage, getPageKeys, addPage } from "@/lib/utils/pages-helpers"
import { newPageMessage } from "@/lib/utils/commit-messages"
import { getPagePreviewImagePath } from "@/lib/utils/section-preview-images"
import type { PageKey } from "@/lib/types/pages"
import { cn } from "@/lib/utils"
import { useAnimationKey } from "@/lib/hooks/use-animation-key"
import { getStaggeredAnimationStyle } from "@/lib/utils/animation"
import { PagePreviewModal } from "./page-preview-modal"
import { PreviewPlaceholder } from "./preview-placeholder"
import { LegalPagesSection } from "./legal-pages"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
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

interface PagesViewProps {
  pages: Array<{ key: PageKey; page: any }>
}

interface SortablePageCardProps {
  page: any
  pageKey: PageKey
  index: number
  editingPage: PageKey | null
  editTitle: string
  templateName: string | null
  hostedUrl: string | null
  isHosting: boolean
  onStartEdit: (pageKey: PageKey) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onSetEditTitle: (title: string) => void
  onToggleShow: (pageKey: PageKey) => void
  onSelectPage: (pageKey: PageKey) => void
  onPreviewClick: (pageKey: PageKey, pageTitle: string) => void
  onHostClick: () => void
  onDelete: (pageKey: PageKey) => void
}

function SortablePageCard({
  page,
  pageKey,
  index,
  editingPage,
  editTitle,
  templateName,
  hostedUrl,
  isHosting,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onSetEditTitle,
  onToggleShow,
  onSelectPage,
  onPreviewClick,
  onHostClick,
  onDelete,
}: SortablePageCardProps) {
  const isHomePage = pageKey.toLowerCase() === "home" || page.title?.toLowerCase() === "home"
  const [imageError, setImageError] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pageKey,
    disabled: isHomePage,
  })

  const previewImagePath = getPagePreviewImagePath(pageKey, templateName)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    ...(getStaggeredAnimationStyle(index) as React.CSSProperties),
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons, drag handle, or input fields
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest("[role='button']") ||
      target.closest("input") ||
      target.closest("[data-drag-handle]")
    ) {
      return
    }
    onSelectPage(pageKey)
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
              alt={`${page.title} preview`}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <PreviewPlaceholder variant="page" />
          )}
          
          {/* Drag Handle - Overlay on top left */}
          <div
            {...(isHomePage ? {} : attributes)}
            {...(isHomePage ? {} : listeners)}
            data-drag-handle
            className={cn(
              "absolute top-2 left-2 p-1.5 rounded-md bg-background/80 backdrop-blur-sm",
              isHomePage ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing hover:bg-background"
            )}
            onClick={(e) => {
              e.stopPropagation()
              if (isHomePage) {
                toast.error("Home page cannot be reordered", {
                  description: "The Home page must always appear first in the navigation.",
                })
              }
            }}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Preview Button - Overlay on top right */}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "absolute top-2 right-2 gap-1.5 h-7 text-xs bg-background/80 backdrop-blur-sm hover:bg-background",
              !hostedUrl && "opacity-70"
            )}
            onClick={(e) => {
              e.stopPropagation()
              if (!hostedUrl) {
                toast.error("Host your site first", {
                  description: "Deploy your site to preview pages.",
                  action: {
                    label: "Host Now",
                    onClick: () => onHostClick(),
                  },
                })
                return
              }
              onPreviewClick(pageKey, page.title)
            }}
            title={!hostedUrl ? "Host your site first to preview" : "Preview page"}
          >
            <ExternalLink className="h-3 w-3" />
            Preview
          </Button>
        </div>

        {/* Card Content */}
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 flex-1">
            <div className="flex-1 min-w-0">
              {editingPage === pageKey ? (
                <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
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
                  <div className="flex gap-2">
                    <Button size="sm" onClick={onSaveEdit} className="h-7 text-xs">
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-7 text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">{page.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onStartEdit(pageKey)
                      }}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {page.description || "No description"}
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Visibility Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  if (isHomePage) {
                    toast.error("Home page cannot be hidden", {
                      description: "The Home page must always be visible as it's the main entry point of your site.",
                    })
                    return
                  }
                  onToggleShow(pageKey)
                }}
                className={cn(
                  "h-8 w-8 p-0 flex-shrink-0",
                  !page.show && "text-muted-foreground",
                  isHomePage && "opacity-50"
                )}
                title={isHomePage ? "Home page is always visible" : page.show ? "Hide page" : "Show page"}
              >
                {page.show ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              {/* Delete button - only for non-Home pages */}
              {!isHomePage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (showDeleteConfirm) {
                      onDelete(pageKey)
                      setShowDeleteConfirm(false)
                    } else {
                      setShowDeleteConfirm(true)
                      setTimeout(() => setShowDeleteConfirm(false), 3000)
                    }
                  }}
                  className={cn(
                    "h-8 w-8 p-0 flex-shrink-0",
                    showDeleteConfirm && "text-red-600 hover:text-red-700 hover:bg-red-50"
                  )}
                  title={showDeleteConfirm ? "Click again to confirm delete" : "Delete page"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function PagesView({ pages }: PagesViewProps) {
  const { pagesData, selectPage, updatePagesData, commitPages, deletePage, isSaving } = usePagesStore()
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const hostTemplateInfo = useRepoAppDataStore((s) => s.hostTemplateInfo)
  const fetchRepoAppData = useRepoAppDataStore((s) => s.fetchRepoAppData)
  const [editingPage, setEditingPage] = useState<PageKey | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [previewModal, setPreviewModal] = useState<{ pageKey: string; pageTitle: string } | null>(null)
  const [isHosting, setIsHosting] = useState(false)
  const [addPageModalOpen, setAddPageModalOpen] = useState(false)
  const [addPageKey, setAddPageKey] = useState("")
  const [addPageTitle, setAddPageTitle] = useState("")
  const [addPageError, setAddPageError] = useState<string | null>(null)

  // Handle hosting the repository
  const handleHost = async () => {
    if (!repoOwnerFromLink || !repoNameFromLink || isHosting) return

    setIsHosting(true)
    try {
      const apiUrl = typeof window !== "undefined" 
        ? "" 
        : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
      const url = `${apiUrl}/api/repositories/host?owner=${encodeURIComponent(repoOwnerFromLink)}&repo=${encodeURIComponent(repoNameFromLink)}`

      const response = await fetch(url, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to host repository")
      }

      const data = await response.json()
      await fetchRepoAppData()
      toast.success("Site hosted successfully!", {
        description: `Your site is now live at ${data.deploymentUrl}`,
      })
    } catch (error) {
      console.error("Error hosting repository:", error)
      toast.error(error instanceof Error ? error.message : "Failed to host repository")
    } finally {
      setIsHosting(false)
    }
  }

  // Generate animation key that changes when pages data changes
  const animationKey = useAnimationKey(pages, (p) => p.key)

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

    // Prevent hiding the home page
    const isHomePage = pageKey.toLowerCase() === "home" || page.title?.toLowerCase() === "home"
    if (isHomePage) return

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

  const handlePreviewClick = (pageKey: string, pageTitle: string) => {
    setPreviewModal({ pageKey, pageTitle })
  }

  const handleDeletePage = async (pageKey: PageKey) => {
    try {
      await deletePage(pageKey)
      toast.success("Page deleted", { description: "The page has been removed." })
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handleAddPage = async () => {
    setAddPageError(null)
    const key = addPageKey.trim().toLowerCase().replace(/\s+/g, "-")
    if (!key) {
      setAddPageError("Page key is required")
      return
    }
    if (!/^[a-z0-9-]+$/.test(key)) {
      setAddPageError("Page key must be lowercase letters, numbers, and hyphens only")
      return
    }
    const title = addPageTitle.trim() || key
    if (!pagesData) return
    if (key in pagesData) {
      setAddPageError(`Page "${key}" already exists`)
      return
    }
    try {
      const updated = addPage(pagesData, key, { title, description: "" })
      updatePagesData(() => updated)
      await commitPages(updated, newPageMessage(title))
      setAddPageModalOpen(false)
      setAddPageKey("")
      setAddPageTitle("")
      toast.success("Page added", { description: `"${title}" has been saved.` })
    } catch (err) {
      setAddPageError((err as Error).message)
      // Store sets hasConflict and error for 409; user can use Refresh and Retry
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-md font-medium">Pages</h4>
            <p className="text-sm text-muted-foreground">
              {pages.length} page{pages.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setAddPageModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Page
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pages.map((p) => p.key)}
            strategy={rectSortingStrategy}
          >
            <div key={animationKey} className="flex flex-wrap gap-4">
              {pages.map(({ key, page }, index) => (
                <SortablePageCard
                  key={key}
                  page={page}
                  pageKey={key}
                  index={index}
                  editingPage={editingPage}
                  editTitle={editTitle}
                  templateName={hostTemplateInfo?.templateName ?? null}
                  hostedUrl={hostTemplateInfo?.hostedAt ?? null}
                  isHosting={isHosting}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onSetEditTitle={setEditTitle}
                  onToggleShow={handleToggleShow}
                  onSelectPage={selectPage}
                  onPreviewClick={handlePreviewClick}
                  onHostClick={handleHost}
                  onDelete={handleDeletePage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Divider */}
      <div className="border-t my-8" />

      {/* Legal Pages Section */}
      <LegalPagesSection />

      {/* Page Preview Modal */}
      <PagePreviewModal
        open={!!previewModal}
        onOpenChange={(open) => {
          if (!open) setPreviewModal(null)
        }}
        pageKey={previewModal?.pageKey || ""}
        pageTitle={previewModal?.pageTitle || ""}
        hostedUrl={hostTemplateInfo?.hostedAt ?? null}
        templateName={hostTemplateInfo?.templateName ?? null}
      />

      {/* Add Page Modal */}
      <Dialog open={addPageModalOpen} onOpenChange={setAddPageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Page</DialogTitle>
            <DialogDescription>
              Create a new page. The page key will be used in the URL (e.g. /blog).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {addPageError && (
              <Alert variant="destructive">
                <AlertDescription>{addPageError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>Page key</Label>
              <Input
                placeholder="e.g. blog, about-us"
                value={addPageKey}
                onChange={(e) => {
                  setAddPageKey(e.target.value)
                  setAddPageError(null)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>
            <div className="space-y-2">
              <Label>Page title</Label>
              <Input
                placeholder="e.g. Blog"
                value={addPageTitle}
                onChange={(e) => setAddPageTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPageModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPage} disabled={isSaving}>
              {isSaving ? "Saving..." : "Add Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
