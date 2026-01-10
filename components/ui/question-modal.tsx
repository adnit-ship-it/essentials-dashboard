"use client"

import { useState, useEffect } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import type { Question, QuestionType, QuestionOption } from "@/lib/types/quiz"
import { QUESTION_TYPE_CONFIGS, OPTION_TYPES } from "@/lib/types/quiz"

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

  const [options, setOptions] = useState<QuestionOption[]>(
    question?.options || []
  )

  const requiresOptions = OPTION_TYPES.includes(formData.type)

  // Reset form when modal opens/closes or question changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        slug: question?.slug || "",
        type: (question?.type || "TEXT") as QuestionType,
        question: question?.question || "",
        display_question: question?.display_question || "",
        placeholder: question?.placeholder || "",
        is_required: question?.is_required || false,
        api_type: question?.api_type || "TEXT",
        validation: question?.validation || [],
      })
      setOptions(question?.options || [])
    }
  }, [isOpen, question])

  // When type changes, handle options accordingly
  useEffect(() => {
    if (requiresOptions && options.length === 0) {
      // Switching to option type with no options - initialize with one empty option
      setOptions([
        {
          id: `temp-${Date.now()}`,
          question_id: formStepId,
          value: "",
          label: null,
          option_order: 1,
        },
      ])
    } else if (!requiresOptions && options.length > 0) {
      // Switching away from option type - clear options
      setOptions([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type])

  const handleAddOption = () => {
    const newOption: QuestionOption = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      question_id: formStepId,
      value: "",
      label: null,
      option_order: options.length + 1,
    }
    setOptions([...options, newOption])
  }

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index).map((opt, i) => ({
      ...opt,
      option_order: i + 1,
    }))
    setOptions(newOptions)
  }

  const handleUpdateOption = (index: number, field: "value" | "label", value: string) => {
    const newOptions = [...options]
    newOptions[index] = {
      ...newOptions[index],
      [field]: value || null,
    }
    setOptions(newOptions)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate options for option types
    if (requiresOptions) {
      if (options.length === 0) {
        alert("Please add at least one option for this question type.")
        return
      }
      
      // Check that all options have values
      const hasEmptyValues = options.some(opt => !opt.value.trim())
      if (hasEmptyValues) {
        alert("All options must have a value.")
        return
      }
    }

    onSave({
      ...formData,
      form_step_id: formStepId,
      question_order: question?.question_order || 0,
      options: requiresOptions ? options : undefined,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {!requiresOptions && (
            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder</Label>
              <Input
                id="placeholder"
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
          )}

          {requiresOptions && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Options</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {options.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No options added. Click "Add Option" to create options for this question.
                  </p>
                ) : (
                  options.map((option, index) => (
                    <div key={option.id} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Option Value *
                          </Label>
                          <Input
                            value={option.value}
                            onChange={(e) =>
                              handleUpdateOption(index, "value", e.target.value)
                            }
                            placeholder="option-value"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Display Label (optional)
                          </Label>
                          <Input
                            value={option.label || ""}
                            onChange={(e) =>
                              handleUpdateOption(index, "label", e.target.value)
                            }
                            placeholder="Display Label"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                        disabled={options.length === 1}
                        className="mt-6"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
                {options.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formData.type === "MULTISELECT"
                      ? "Users can select multiple options"
                      : formData.type === "DROPDOWN"
                      ? "Options will appear in a dropdown menu"
                      : formData.type === "SINGLESELECT"
                      ? "Users can select one option"
                      : "Users can select one option via checkbox"}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

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

