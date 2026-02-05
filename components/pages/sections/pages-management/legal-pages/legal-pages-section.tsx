"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, AlertTriangle, RefreshCw, Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLegalStore } from "@/lib/stores/legal-store";
import { useOrganizationStore } from "@/lib/stores/organization-store";
import type { LegalPage } from "@/lib/types/legal";
import { getSortedLegalPages } from "@/lib/types/legal";
import { LegalPageCard } from "./legal-page-card";
import { LegalPageEditorModal } from "./legal-page-editor-modal";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export function LegalPagesSection() {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore();

  const {
    legalData,
    isLoading,
    isSaving,
    error,
    hasPendingChanges,
    fetchData,
    addPage,
    updatePage,
    deletePage,
    reorderPages,
    saveAll,
    discardChanges,
    setEditingPage,
    editingPageId,
  } = useLegalStore();

  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<LegalPage | null>(null);
  const [isNewPage, setIsNewPage] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (repoOwnerFromLink && repoNameFromLink) {
      fetchData();
    }
  }, [repoOwnerFromLink, repoNameFromLink, fetchData]);

  // Handle opening editor for existing page
  const handleEdit = useCallback(
    (pageId: string) => {
      const page = legalData?.pages.find((p) => p.id === pageId);
      if (page) {
        setSelectedPage(page);
        setIsNewPage(false);
        setEditorOpen(true);
        setEditingPage(pageId);
      }
    },
    [legalData, setEditingPage]
  );

  // Handle creating new page
  const handleAddNew = useCallback(() => {
    setSelectedPage(null);
    setIsNewPage(true);
    setEditorOpen(true);
  }, []);

  // Handle save from editor
  const handleSave = useCallback(
    (page: LegalPage) => {
      if (isNewPage) {
        addPage(page.title);
        // Get the newly added page and update it with full data
        setTimeout(() => {
          const newPage = useLegalStore.getState().legalData?.pages.find(
            (p) => p.title === page.title
          );
          if (newPage) {
            updatePage(newPage.id, {
              ...page,
              id: newPage.id,
            });
          }
        }, 0);
      } else {
        updatePage(page.id, page);
      }
      setEditorOpen(false);
      setEditingPage(null);
    },
    [isNewPage, addPage, updatePage, setEditingPage]
  );

  // Handle delete
  const handleDelete = useCallback(
    (pageId: string) => {
      deletePage(pageId);
    },
    [deletePage]
  );

  // Handle footer toggle
  const handleToggleFooter = useCallback(
    (pageId: string) => {
      const page = legalData?.pages.find((p) => p.id === pageId);
      if (page) {
        updatePage(pageId, { showInFooter: !page.showInFooter });
      }
    },
    [legalData, updatePage]
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && legalData) {
      const sortedPages = getSortedLegalPages(legalData);
      const oldIndex = sortedPages.findIndex((p) => p.id === active.id);
      const newIndex = sortedPages.findIndex((p) => p.id === over.id);

      const newOrder = arrayMove(sortedPages, oldIndex, newIndex);
      reorderPages(newOrder.map((p) => p.id));
    }
  };

  // Handle save all
  const handleSaveAll = async () => {
    try {
      await saveAll();
    } catch (err) {
      console.error("Failed to save:", err);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={fetchData} className="mt-4" variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sortedPages = legalData ? getSortedLegalPages(legalData) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-md font-medium">Legal Pages</h4>
          <p className="text-sm text-muted-foreground">
            {sortedPages.length} page{sortedPages.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPendingChanges && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={discardChanges}
                disabled={isSaving}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Discard
              </Button>
              <Button size="sm" onClick={handleSaveAll} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading || isSaving}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Page
          </Button>
        </div>
      </div>

      {/* Pages List */}
      {sortedPages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No legal pages yet. Create your first page to get started.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create Legal Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedPages.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedPages.map((page, index) => (
                <LegalPageCard
                  key={page.id}
                  page={page}
                  index={index}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleFooter={handleToggleFooter}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Editor Modal */}
      <LegalPageEditorModal
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setEditingPage(null);
          }
        }}
        page={selectedPage}
        isNew={isNewPage}
        onSave={handleSave}
      />
    </div>
  );
}
