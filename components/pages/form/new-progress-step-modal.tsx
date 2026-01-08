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
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useFormLocalState } from "@/lib/hooks/use-form-local-state"
import { generateSlug } from "@/lib/utils/quiz-helpers"

interface NewProgressStepModalProps {
  isOpen: boolean
  onClose: () => void
  quiz: FullQuiz
}

export function NewProgressStepModal({ isOpen, onClose, quiz }: NewProgressStepModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#3B82F6")
  
  const localState = useFormLocalState({ quiz })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName("")
      setDescription("")
      setColor("#3B82F6")
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      return
    }

    // Create the new progress step
    localState.addProgressStep({
      slug: generateSlug(name),
      name: name.trim(),
      description: description.trim() || null,
      color: color || null,
    })
    
    // Reset form and close modal
    setName("")
    setDescription("")
    setColor("#3B82F6")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Progress Step</DialogTitle>
          <DialogDescription>Add a new progress section to your quiz</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Personal Information"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this progress section"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Progress Step
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

