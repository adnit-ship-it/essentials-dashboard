"use client"

import { QuizFormStep } from "@/lib/types/quiz"
import { cn } from "@/lib/utils"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FormStepItemProps {
  step: QuizFormStep
  isSelected: boolean
  onClick: () => void
  onDelete?: (stepId: string) => void
}

export function FormStepItem({ step, isSelected, onClick, onDelete }: FormStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: step.id,
    transition: {
      duration: 200,
      easing: 'ease',
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(step.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-2 rounded-md cursor-pointer hover:bg-muted flex items-center gap-2 group",
        isSelected && "bg-muted font-medium",
        isDragging && "border-2 border-dashed border-primary"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1" onClick={onClick}>
        <div className="text-sm">{step.title}</div>
        {step.heading1 && (
          <div className="text-xs text-muted-foreground truncate">{step.heading1}</div>
        )}
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

