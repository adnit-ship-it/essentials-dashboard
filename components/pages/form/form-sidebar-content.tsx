"use client"

import { FullQuiz } from "@/lib/types/quiz"
import { ProgressStepsAccordion } from "./progress-steps-accordion"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { NewProgressStepModal } from "./new-progress-step-modal"

interface FormSidebarContentProps {
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

export function FormSidebarContent({
  quiz,
  onStepSelect,
  selectedStepId,
  onReorderStep,
  onReorderProgressStep,
}: FormSidebarContentProps) {
  const [progressStepModalOpen, setProgressStepModalOpen] = useState(false)

  return (
    <div className="p-4 space-y-4">
      <ProgressStepsAccordion
        quiz={quiz}
        onStepSelect={onStepSelect}
        selectedStepId={selectedStepId}
        onReorderStep={onReorderStep}
        onReorderProgressStep={onReorderProgressStep}
        onAddFormStep={(progressStepId) => {
          // This will be handled by the NewStepButton inside the accordion
        }}
      />
      <Button
        onClick={() => setProgressStepModalOpen(true)}
        variant="outline"
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Progress Step
      </Button>
      <NewProgressStepModal
        isOpen={progressStepModalOpen}
        onClose={() => setProgressStepModalOpen(false)}
        quiz={quiz}
      />
    </div>
  )
}

