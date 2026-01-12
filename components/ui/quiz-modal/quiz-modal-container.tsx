"use client"

import { FullQuiz } from "@/lib/types/quiz"
import { QuizModalHeader } from "./quiz-modal-header"
import { ProgressStepsAccordion } from "./progress-steps-accordion"
import { ProductBundleIdsEditor } from "./product-bundle-ids-editor"
import { ProductLinksEditor } from "./product-links-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface QuizModalContainerProps {
  quiz: FullQuiz
  onClose: () => void
  onOpenBuilder: (quizId: string) => void
}

export function QuizModalContainer({
  quiz,
  onClose,
  onOpenBuilder,
}: QuizModalContainerProps) {
  return (
    <div className="space-y-6">
      <QuizModalHeader quiz={quiz} onClose={onClose} />

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">
                {quiz.description || "No description"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Progress Steps</h3>
              <ProgressStepsAccordion quiz={quiz} />
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Linked Products</h3>
              <ProductLinksEditor quiz={quiz} />
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Product Bundle IDs</h3>
              <ProductBundleIdsEditor quiz={quiz} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={() => {
            onOpenBuilder(quiz.id)
            onClose()
          }}
        >
          Open Form Builder
        </Button>
      </div>
    </div>
  )
}

