"use client"

import { FullQuiz } from "@/lib/types/quiz"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface ProgressStepsAccordionProps {
  quiz: FullQuiz
}

export function ProgressStepsAccordion({ quiz }: ProgressStepsAccordionProps) {
  const progressSteps = quiz.progressSteps || []

  if (progressSteps.length === 0) {
    return <p className="text-sm text-muted-foreground">No progress steps</p>
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {progressSteps.map((step) => {
        const formStepsInStep = quiz.stepProgressMapping
          ?.filter((m) => m.progress_step_id === step.id)
          .map((m) => quiz.formSteps.find((fs) => fs.id === m.form_step_id))
          .filter(Boolean) || []

        return (
          <AccordionItem key={step.id} value={step.id}>
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: step.color || "#3B82F6" }}
                />
                <span>{step.name}</span>
                {formStepsInStep.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({formStepsInStep.length} steps)
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-5">
                {step.description && (
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                )}
                {formStepsInStep.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {formStepsInStep.map((fs) => (
                      <li key={fs?.id} className="text-sm">
                        {fs?.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No form steps in this progress step</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}




