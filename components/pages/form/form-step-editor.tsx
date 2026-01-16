"use client"

import { useState, useMemo, useEffect } from "react"
import { FullQuiz, QuizFormStep, Question } from "@/lib/types/quiz"
import { migrateIsRequiredToValidation } from "@/lib/utils/question-validator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, GripVertical } from "lucide-react"
import { QuestionModal } from "@/components/ui/question-modal"
import { ConditionalRenderingEditor } from "@/components/ui/conditional-rendering-editor"
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

interface FormStepEditorProps {
  quiz: FullQuiz
  step: QuizFormStep
  onStepUpdate: (stepId: string, updates: any) => void
}

function SortableQuestionItem({
  question,
  onEdit,
  onDelete,
}: {
  question: Question
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
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
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 border rounded-md flex items-center justify-between",
        isDragging && "border-2 border-dashed border-primary"
      )}
    >
      <div className="flex items-center gap-2 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="font-medium">{question.question}</div>
          <div className="text-sm text-muted-foreground">
            {question.type} {question.required && "• Required"}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function FormStepEditor({ quiz, step, onStepUpdate }: FormStepEditorProps) {
  const [questionModalOpen, setQuestionModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>()

  const handleUpdate = (field: string, value: any) => {
    onStepUpdate(step.id, { [field]: value })
  }

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

  // Sort questions by order for display
  const sortedQuestions = useMemo(() => {
    if (!step.questions) return []
    return [...step.questions].sort((a, b) => a.question_order - b.question_order)
  }, [step.questions])

  const questionIds = useMemo(() => {
    return sortedQuestions.map((q) => q.id)
  }, [sortedQuestions])

  const handleQuestionSave = (questionData: Partial<Question>) => {
    const questions = step.questions || []
    
    // Migrate is_required to validation if present
    const baseQuestion: Partial<Question> = {
      ...questionData,
      id: questionData.id || editingQuestion?.id || `question-${Date.now()}`,
      form_step_id: step.id,
      slug: questionData.slug || "",
      type: questionData.type || "TEXT",
      question: questionData.question || editingQuestion?.question || "", // Ensure question is preserved
      displayQuestion: questionData.displayQuestion || null,
      placeholder: questionData.placeholder || null,
      question_order: questionData.question_order || (editingQuestion ? editingQuestion.question_order : questions.length + 1),
      validation: questionData.validation || null,
      required: questionData.required ?? false,
      api_type: questionData.api_type || null,
      options: questionData.options || undefined,
    }
    
    const migratedQuestionData = migrateIsRequiredToValidation(baseQuestion as Question)
    
    if (editingQuestion) {
      // Update existing question
      const updated = questions.map((q) =>
        q.id === editingQuestion.id ? migratedQuestionData : q
      )
      // Recalculate orders
      const questionsWithOrder = updated.map((q, index) => ({
        ...q,
        question_order: index + 1,
      }))
      handleUpdate("questions", questionsWithOrder)
    } else {
      // Add new question
      const newQuestion: Question = {
        ...migratedQuestionData,
        id: `question-${Date.now()}`,
        form_step_id: step.id,
        question_order: questions.length + 1,
      }
      const updated = [...questions, newQuestion]
      // Recalculate orders
      const questionsWithOrder = updated.map((q, index) => ({
        ...q,
        question_order: index + 1,
      }))
      handleUpdate("questions", questionsWithOrder)
    }
    setQuestionModalOpen(false)
    setEditingQuestion(undefined)
  }

  const handleDeleteQuestion = (questionId: string) => {
    const questions = (step.questions || []).filter((q) => q.id !== questionId)
    // Recalculate orders
    const questionsWithOrder = questions.map((q, index) => ({
      ...q,
      question_order: index + 1,
    }))
    handleUpdate("questions", questionsWithOrder)
  }

  const handleQuestionReorder = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      console.log("Question reorder cancelled:", { active: active.id, over: over?.id })
      return
    }

    console.log("=== QUESTION REORDER ===")
    console.log("Active ID:", active.id)
    console.log("Over ID:", over.id)
    console.log("Sorted Questions Before:", sortedQuestions.map(q => ({ id: q.id, question: q.question, order: q.question_order })))

    // Use sorted questions to maintain correct order
    const oldIndex = sortedQuestions.findIndex((q) => q.id === active.id)
    const newIndex = sortedQuestions.findIndex((q) => q.id === over.id)

    console.log("Old Index:", oldIndex, "New Index:", newIndex)

    if (oldIndex === -1 || newIndex === -1) {
      console.warn("Could not find question indices", { oldIndex, newIndex })
      return
    }

    // Reorder questions using sorted array
    const reordered = [...sortedQuestions]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    console.log("Reordered Questions:", reordered.map(q => ({ id: q.id, question: q.question })))

    // Recalculate orders
    const questionsWithOrder = reordered.map((q, index) => ({
      ...q,
      question_order: index + 1,
    }))

    console.log("Questions With Order:", questionsWithOrder.map(q => ({ id: q.id, question: q.question, order: q.question_order })))

    handleUpdate("questions", questionsWithOrder)
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setQuestionModalOpen(true)
  }

  const handleAddQuestion = () => {
    setEditingQuestion(undefined)
    setQuestionModalOpen(true)
  }

  const handleConditionChange = (condition: any) => {
    handleUpdate("render_condition", condition)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={step.title ?? ""}
              onChange={(e) => handleUpdate("title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heading1">Heading</Label>
            <Input
              id="heading1"
              value={step.heading1 || ""}
              onChange={(e) => handleUpdate("heading1", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtext">Subtext</Label>
            <Textarea
              id="subtext"
              value={step.subtext || ""}
              onChange={(e) => handleUpdate("subtext", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Questions</CardTitle>
            <Button size="sm" onClick={handleAddQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedQuestions.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleQuestionReorder}
            >
              <SortableContext
                items={questionIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {sortedQuestions.map((question) => (
                    <SortableQuestionItem
                      key={question.id}
                      question={question}
                      onEdit={() => handleEditQuestion(question)}
                      onDelete={() => handleDeleteQuestion(question.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-sm text-muted-foreground">No questions yet</p>
          )}
        </CardContent>
      </Card>

      <ConditionalRenderingEditor
        condition={step.render_condition}
        quiz={quiz}
        currentFormStepId={step.id}
        onChange={handleConditionChange}
      />

      <QuestionModal
        isOpen={questionModalOpen}
        onClose={() => {
          setQuestionModalOpen(false)
          setEditingQuestion(undefined)
        }}
        onSave={handleQuestionSave}
        question={editingQuestion}
        formStepId={step.id}
      />
    </div>
  )
}

