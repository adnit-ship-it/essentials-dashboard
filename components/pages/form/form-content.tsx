"use client"

import { FullQuiz, QuizFormStep } from "@/lib/types/quiz"
import { FormContentHeader } from "./form-content-header"
import { FormContentBody } from "./form-content-body"

interface FormContentProps {
  quiz: FullQuiz
  selectedStep: QuizFormStep | null
  onStepUpdate: (stepId: string, updates: any) => void
}

export function FormContent({ quiz, selectedStep, onStepUpdate }: FormContentProps) {
  return (
    <div className="flex flex-col h-full">
      <FormContentHeader selectedStep={selectedStep} />
      <div className="flex-1 overflow-y-auto">
        <FormContentBody quiz={quiz} selectedStep={selectedStep} onStepUpdate={onStepUpdate} />
      </div>
    </div>
  )
}




