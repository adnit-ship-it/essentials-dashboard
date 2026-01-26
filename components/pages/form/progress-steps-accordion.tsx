"use client"

import { useMemo } from "react"
import { FullQuiz } from "@/lib/types/quiz"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FormStepItem } from "./form-step-item"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { NewStepButton } from "./new-step-button"

interface ProgressStepsAccordionProps {
  quiz: FullQuiz
  onStepSelect: (step: any) => void
  selectedStepId: string | null
  onReorderStep?: (
    stepId: string,
    newOrder: number,
    newProgressStepId: string,
    oldProgressStepId: string
  ) => void
  onReorderProgressStep?: (
    progressStepId: string,
    newOrder: number
  ) => void
  onAddFormStep?: (progressStepId: string) => void
  onDeleteStep?: (stepId: string) => void
}

function DroppableProgressStep({
  id,
  children,
  isOver,
}: {
  id: string
  children: React.ReactNode
  isOver?: boolean
}) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={isOver ? "bg-muted/50 rounded-md p-2" : ""}
    >
      {children}
    </div>
  )
}

function SortableProgressStepTrigger({
  progressStepId,
  progressStep,
  formStepCount,
}: {
  progressStepId: string
  progressStep: { name: string; color?: string | null }
  formStepCount: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `progress-${progressStepId}`,
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

  return (
    <div ref={setNodeRef} style={style}>
      <AccordionTrigger
        className={cn(
          isDragging && "border-2 border-dashed border-primary rounded-md"
        )}
      >
        <div className="flex items-center gap-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: progressStep.color || "#3B82F6" }}
          />
          <span className="flex-1 text-left">{progressStep.name}</span>
          {formStepCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({formStepCount})
            </span>
          )}
        </div>
      </AccordionTrigger>
    </div>
  )
}

export function ProgressStepsAccordion({
  quiz,
  onStepSelect,
  selectedStepId,
  onReorderStep,
  onReorderProgressStep,
  onAddFormStep,
  onDeleteStep,
}: ProgressStepsAccordionProps) {
  const progressSteps = [...(quiz.progressSteps || [])].sort(
    (a, b) => a.order - b.order
  )

  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Group form steps by progress step
  const formStepsByProgressStep = useMemo(() => {
    const grouped: Record<string, typeof quiz.formSteps> = {}
    
    progressSteps.forEach((progressStep) => {
      const steps = quiz.formSteps
        .filter((fs) => fs.progressStepId === progressStep.id)
        .sort((a, b) => a.order - b.order)
      
      grouped[progressStep.id] = steps
    })
    
    return grouped
  }, [quiz, progressSteps])

  // Get all form step IDs for SortableContext
  const allFormStepIds = useMemo(() => {
    return quiz.formSteps.map((fs) => fs.id)
  }, [quiz.formSteps])

  // Get all progress step IDs for SortableContext
  const progressStepIds = useMemo(() => {
    return progressSteps.map((ps) => `progress-${ps.id}`)
  }, [progressSteps])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dragging a progress step
    if (activeId.startsWith("progress-")) {
      if (!onReorderProgressStep) return
      
      const draggedProgressStepId = activeId.replace("progress-", "")
      
      // If dropped on another progress step
      if (overId.startsWith("progress-")) {
        const targetProgressStepId = overId.replace("progress-", "")
        
        if (draggedProgressStepId === targetProgressStepId) return

        const draggedProgressStep = progressSteps.find(
          (ps) => ps.id === draggedProgressStepId
        )
        const targetProgressStep = progressSteps.find(
          (ps) => ps.id === targetProgressStepId
        )

        if (!draggedProgressStep || !targetProgressStep) return

        // Calculate new order based on target position
        const newOrder = targetProgressStep.order
        onReorderProgressStep(draggedProgressStepId, newOrder)
        return
      }
      
      // If dropped on a form step, find its parent progress step
      const targetFormStep = quiz.formSteps.find((fs) => fs.id === overId)
      if (targetFormStep) {
        const targetProgressStepId = targetFormStep.progressStepId
        const targetProgressStep = progressSteps.find(
          (ps) => ps.id === targetProgressStepId
        )
        if (targetProgressStep) {
          const newOrder = targetProgressStep.order
          onReorderProgressStep(draggedProgressStepId, newOrder)
          return
        }
      }
      
      return
    }

    // Otherwise, handle form step reordering
    if (!onReorderStep) return

    const draggedStepId = activeId
    const draggedStep = quiz.formSteps.find((fs) => fs.id === draggedStepId)
    if (!draggedStep) return

    // Find current progress step for dragged step
    const oldProgressStepId = draggedStep.progressStepId || ""

    // Determine target progress step
    let newProgressStepId = oldProgressStepId
    let targetStepId: string | null = null

    // Check if dropped on a progress step droppable zone
    if (typeof over.id === "string" && over.id.startsWith("progress-")) {
      newProgressStepId = over.id.replace("progress-", "")
    } else if (typeof over.id === "string") {
      // Dropped on another form step - find its progress step
      const targetStep = quiz.formSteps.find((fs) => fs.id === over.id)
      if (targetStep) {
        targetStepId = targetStep.id
        newProgressStepId = targetStep.progressStepId
      }
    }

    // Get all steps in target progress step (excluding dragged step)
    const stepsInTargetWithoutDragged = (formStepsByProgressStep[newProgressStepId] || []).filter(
      (fs) => fs.id !== draggedStepId
    )

    let newOrder = 1

    if (targetStepId && targetStepId !== draggedStepId) {
      // Dropped on another form step - use its order
      const targetStep = quiz.formSteps.find((fs) => fs.id === targetStepId)
      if (targetStep) {
        if (oldProgressStepId === newProgressStepId) {
          // Same progress step - reordering within
          const currentOrder = draggedStep.order
          const targetOrder = targetStep.order
          
          // Find the index of target step in the filtered list
          const targetIndex = stepsInTargetWithoutDragged.findIndex((fs) => fs.id === targetStepId)
          
          if (targetIndex >= 0) {
            // Insert at target position
            newOrder = targetOrder
          } else {
            // Fallback: append to end
            newOrder = stepsInTargetWithoutDragged.length + 1
          }
        } else {
          // Different progress step - insert at target position
          newOrder = targetStep.order
        }
      }
    } else {
      // Dropped on progress step droppable zone or empty space - append to end
      newOrder = stepsInTargetWithoutDragged.length + 1
    }

    // Ensure order is at least 1
    newOrder = Math.max(1, newOrder)

    onReorderStep(draggedStepId, newOrder, newProgressStepId, oldProgressStepId)
  }

  if (progressSteps.length === 0) {
    return <p className="text-sm text-muted-foreground">No progress steps</p>
  }

  const activeFormStep = activeId && !activeId.startsWith("progress-")
    ? quiz.formSteps.find((fs) => fs.id === activeId)
    : null

  const activeProgressStep = activeId && activeId.startsWith("progress-")
    ? progressSteps.find((ps) => `progress-${ps.id}` === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveId(event.active.id as string)}
      onDragEnd={(event) => {
        handleDragEnd(event)
        setActiveId(null)
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext
        items={[...progressStepIds, ...allFormStepIds]}
        strategy={verticalListSortingStrategy}
      >
        <Accordion type="single" collapsible className="w-full">
          {progressSteps.map((progressStep) => {
            const formStepsInStep = formStepsByProgressStep[progressStep.id] || []
            const stepIds = formStepsInStep.map((fs) => fs.id)

            return (
              <AccordionItem key={progressStep.id} value={progressStep.id}>
                <SortableProgressStepTrigger
                  progressStepId={progressStep.id}
                  progressStep={progressStep}
                  formStepCount={formStepsInStep.length}
                />
                <AccordionContent>
                  <DroppableProgressStep id={`progress-${progressStep.id}`}>
                    <div className="space-y-2 pl-5">
                      {formStepsInStep.length > 0 ? (
                        <SortableContext
                          items={stepIds}
                          strategy={verticalListSortingStrategy}
                        >
                          {formStepsInStep.map((fs) =>
                            fs ? (
                              <FormStepItem
                                key={fs.id}
                                step={fs}
                                isSelected={fs.id === selectedStepId}
                                onClick={() => onStepSelect(fs)}
                                onDelete={onDeleteStep}
                              />
                            ) : null
                          )}
                        </SortableContext>
                      ) : (
                        <p className="text-sm text-muted-foreground">No form steps</p>
                      )}
                      {onAddFormStep && (
                        <div className="pt-2">
                          <NewStepButton 
                            quiz={quiz} 
                            defaultProgressStepId={progressStep.id}
                            onProgressStepSelected={onAddFormStep}
                          />
                        </div>
                      )}
                    </div>
                  </DroppableProgressStep>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </SortableContext>
      <DragOverlay>
        {activeFormStep ? (
          <div className="p-2 rounded-md bg-background border-2 border-primary shadow-lg opacity-95">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{activeFormStep.title}</div>
                {activeFormStep.heading1 && (
                  <div className="text-xs text-muted-foreground truncate">{activeFormStep.heading1}</div>
                )}
              </div>
            </div>
          </div>
        ) : activeProgressStep ? (
          <div className="p-2 rounded-md bg-background border-2 border-primary shadow-lg opacity-95">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activeProgressStep.color || "#3B82F6" }}
              />
              <span className="text-sm font-medium">{activeProgressStep.name}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

