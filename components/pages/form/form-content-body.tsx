"use client"

import { FullQuiz, QuizFormStep } from "@/lib/types/quiz"
import { FormStepEditor } from "./form-step-editor"
import { EmptyState } from "./empty-state"

interface FormContentBodyProps {
  quiz: FullQuiz
  selectedStep: QuizFormStep | null
  onStepUpdate: (stepId: string, updates: any) => void
}

export function FormContentBody({
  quiz,
  selectedStep,
  onStepUpdate,
}: FormContentBodyProps) {
  if (!selectedStep) {
    return <EmptyState />
  }

  return (
    <div className="p-6">
      <FormStepEditor quiz={quiz} step={selectedStep} onStepUpdate={onStepUpdate} />
    </div>
  )
}




