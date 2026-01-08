"use client"

import { FullQuiz } from "@/lib/types/quiz"
import { FormSidebar } from "./form-sidebar"
import { FormContent } from "./form-content"
import { useFormLocalState } from "@/lib/hooks/use-form-local-state"
import { useFormStepSelection } from "@/lib/hooks/use-form-step-selection"

interface FormPageContainerProps {
  quiz: FullQuiz
}

export function FormPageContainer({ quiz }: FormPageContainerProps) {
  const localState = useFormLocalState({ quiz })
  const stepSelection = useFormStepSelection()

  // Get the current selected step from local quiz to ensure it's always up-to-date
  const selectedStepId = stepSelection.selectedStep?.id || null
  const selectedStep = selectedStepId
    ? (localState.localQuiz || quiz).formSteps.find((fs) => fs.id === selectedStepId) || null
    : null

  return (
    <div className="flex" style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}>
      <div className="w-80 border-r overflow-y-auto">
        <FormSidebar
          quiz={localState.localQuiz || quiz}
          onStepSelect={stepSelection.selectStep}
          selectedStepId={selectedStepId}
          onReorderStep={localState.reorderFormStep}
          onReorderProgressStep={localState.reorderProgressStep}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <FormContent
          quiz={localState.localQuiz || quiz}
          selectedStep={selectedStep}
          onStepUpdate={localState.updateFormStep}
        />
      </div>
    </div>
  )
}

