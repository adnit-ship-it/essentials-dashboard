"use client";

import { useState } from "react";
import {
  GripVertical,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  FileText,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LegalPage } from "@/lib/types/legal";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LegalPageCardProps {
  page: LegalPage;
  index: number;
  onEdit: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onToggleFooter: (pageId: string) => void;
}

export function LegalPageCard({
  page,
  index,
  onEdit,
  onDelete,
  onToggleFooter,
}: LegalPageCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(page.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Reset after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <Card
        className={cn(
          "cursor-pointer hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] transition-all duration-200 overflow-hidden"
        )}
        onClick={() => onEdit(page.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              data-drag-handle
              className="p-1.5 rounded-md hover:bg-muted cursor-grab active:cursor-grabbing flex-shrink-0 mt-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm truncate">{page.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                /legal/{page.slug}
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Updated: {page.lastUpdated}</span>
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Footer visibility toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFooter(page.id)}
                className={cn(
                  "h-8 w-8 p-0",
                  !page.showInFooter && "text-muted-foreground"
                )}
                title={
                  page.showInFooter ? "Shown in footer" : "Hidden from footer"
                }
              >
                {page.showInFooter ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>

              {/* Edit button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(page.id)}
                className="h-8 w-8 p-0"
                title="Edit page"
              >
                <Edit2 className="h-4 w-4" />
              </Button>

              {/* Delete button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className={cn(
                  "h-8 w-8 p-0",
                  showDeleteConfirm && "text-red-600 hover:text-red-700 hover:bg-red-50"
                )}
                title={showDeleteConfirm ? "Click again to confirm" : "Delete page"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
