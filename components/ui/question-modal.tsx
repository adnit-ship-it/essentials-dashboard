"use client"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Question, QuestionType } from "@/lib/types/quiz"
import { QUESTION_TYPE_CONFIGS } from "@/lib/types/quiz"

interface QuestionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (question: Partial<Question>) => void
  question?: Question
  formStepId: string
}

export function QuestionModal({
  isOpen,
  onClose,
  onSave,
  question,
  formStepId,
}: QuestionModalProps) {
  const [formData, setFormData] = useState({
    slug: question?.slug || "",
    type: (question?.type || "TEXT") as QuestionType,
    question: question?.question || "",
    display_question: question?.display_question || "",
    placeholder: question?.placeholder || "",
    is_required: question?.is_required || false,
    api_type: question?.api_type || "TEXT",
    validation: question?.validation || [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      form_step_id: formStepId,
      question_order: question?.question_order || 0,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{question ? "Edit Question" : "Create Question"}</DialogTitle>
          <DialogDescription>
            {question ? "Update question details" : "Add a new question to this step"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Question Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as QuestionType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPE_CONFIGS.map((config) => (
                  <SelectItem key={config.value} value={config.value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g., email-address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Question Text *</Label>
            <Input
              id="question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="What is your email?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_question">Display Question</Label>
            <Input
              id="display_question"
              value={formData.display_question}
              onChange={(e) =>
                setFormData({ ...formData, display_question: e.target.value })
              }
              placeholder="Email Address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={formData.placeholder}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              placeholder="Enter your email"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_required}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_required: checked })
              }
            />
            <Label>Required field</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.slug || !formData.question}>
              {question ? "Update" : "Create"} Question
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

