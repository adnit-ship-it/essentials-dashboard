"use client"

import { QuizFormStep } from "@/lib/types/quiz"

interface FormContentHeaderProps {
  selectedStep: QuizFormStep | null
}

export function FormContentHeader({ selectedStep }: FormContentHeaderProps) {
  if (!selectedStep) {
    return (
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">No step selected</h2>
      </div>
    )
  }

  return (
    <div className="p-6 border-b">
      <h2 className="text-lg font-semibold">{selectedStep.title}</h2>
      {selectedStep.heading1 && (
        <p className="text-sm text-muted-foreground mt-1">{selectedStep.heading1}</p>
      )}
    </div>
  )
}




