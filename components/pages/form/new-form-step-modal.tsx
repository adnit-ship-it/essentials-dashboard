"use client"

import { FullQuiz } from "@/lib/types/quiz"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useFormLocalState } from "@/lib/hooks/use-form-local-state"
import { generateTempId, generateSlug, calculateNextStepOrder } from "@/lib/utils/quiz-helpers"
import type { LocalFormStep } from "@/lib/types/quiz"

interface NewFormStepModalProps {
  isOpen: boolean
  onClose: () => void
  quiz: FullQuiz
  defaultProgressStepId?: string
}

export function NewFormStepModal({ isOpen, onClose, quiz, defaultProgressStepId }: NewFormStepModalProps) {
  const [title, setTitle] = useState("")
  const [heading1, setHeading1] = useState("")
  const [progressStepId, setProgressStepId] = useState<string>(
    defaultProgressStepId || quiz.progressSteps[0]?.id || ""
  )
  
  const localState = useFormLocalState({ quiz })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle("")
      setHeading1("")
      setProgressStepId(defaultProgressStepId || quiz.progressSteps[0]?.id || "")
    }
  }, [isOpen, quiz.progressSteps, defaultProgressStepId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      return
    }

    if (!progressStepId) {
      console.error("No progress step selected")
      return
    }

    // Calculate the next step order for this progress step
    const stepOrder = calculateNextStepOrder(
      quiz.formSteps,
      progressStepId
    )

    // Create the new form step
    const newStep: LocalFormStep = {
      id: generateTempId(),
      slug: generateSlug(title),
      title: title.trim(),
      heading1: heading1.trim() || null,
      subtext: null,
      config: null,
      is_template_step: false,
      render_condition: null,
      questions: [],
      order: stepOrder,
      progressStepId: progressStepId,
    }

    // Add the step to the quiz
    localState.addNewFormStep(newStep)
    
    // Reset form and close modal
    setTitle("")
    setHeading1("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Form Step</DialogTitle>
          <DialogDescription>Add a new step to your quiz</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Personal Information"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heading1">Heading</Label>
            <Input
              id="heading1"
              value={heading1}
              onChange={(e) => setHeading1(e.target.value)}
              placeholder="Main heading text"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="progressStep">Progress Step *</Label>
            <Select value={progressStepId} onValueChange={setProgressStepId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a progress step" />
              </SelectTrigger>
              <SelectContent>
                {quiz.progressSteps.map((ps) => (
                  <SelectItem key={ps.id} value={ps.id}>
                    {ps.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {quiz.progressSteps.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No progress steps available. Please create a progress step first.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || !progressStepId || quiz.progressSteps.length === 0}
            >
              Create Step
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}




