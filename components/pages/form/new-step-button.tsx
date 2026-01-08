"use client"

import { FullQuiz } from "@/lib/types/quiz"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { NewFormStepModal } from "./new-form-step-modal"

interface NewStepButtonProps {
  quiz: FullQuiz
  defaultProgressStepId?: string
  onProgressStepSelected?: (progressStepId: string) => void
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "outline" | "ghost"
}

export function NewStepButton({ 
  quiz, 
  defaultProgressStepId,
  onProgressStepSelected,
  size = "default",
  variant = "outline"
}: NewStepButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleOpen = () => {
    if (defaultProgressStepId && onProgressStepSelected) {
      onProgressStepSelected(defaultProgressStepId)
    }
    setModalOpen(true)
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        variant={variant}
        size={size}
        className={size === "default" ? "w-full" : ""}
      >
        <Plus className="h-4 w-4 mr-2" />
        New Step
      </Button>
      <NewFormStepModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        quiz={quiz}
        defaultProgressStepId={defaultProgressStepId}
      />
    </>
  )
}




