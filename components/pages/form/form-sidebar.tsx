"use client"

import { FullQuiz } from "@/lib/types/quiz"
import { FormSidebarHeader } from "./form-sidebar-header"
import { FormSidebarContent } from "./form-sidebar-content"

interface FormSidebarProps {
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
}

export function FormSidebar({
  quiz,
  onStepSelect,
  selectedStepId,
  onReorderStep,
  onReorderProgressStep,
}: FormSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <FormSidebarHeader quiz={quiz} />
      <div className="flex-1 overflow-y-auto">
        <FormSidebarContent
          quiz={quiz}
          onStepSelect={onStepSelect}
          selectedStepId={selectedStepId}
          onReorderStep={onReorderStep}
          onReorderProgressStep={onReorderProgressStep}
        />
      </div>
    </div>
  )
}

