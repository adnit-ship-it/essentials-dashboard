"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Plus, Trash2, Info, ChevronDown, ChevronUp, GripVertical } from "lucide-react"
import type { Question, QuestionType, QuestionOption, ValidationRule, ValidationRuleType } from "@/lib/types/quiz"
import { QUESTION_TYPE_CONFIGS, OPTION_TYPES } from "@/lib/types/quiz"
import { getAvailableValidations, validateRegexPattern, migrateIsRequiredToValidation } from "@/lib/utils/question-validator"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

interface QuestionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (question: Partial<Question>) => void
  question?: Question
  formStepId: string
}

function SortableOptionItem({
  option,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  option: QuestionOption
  index: number
  onUpdate: (index: number, field: "value" | "label", value: string) => void
  onRemove: (index: number) => void
  canRemove: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: option.id,
    transition: {
      duration: 200,
      easing: 'ease',
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex gap-2 items-start",
        isDragging && "opacity-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors mt-6"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Option Value *
          </Label>
          <Input
            value={option.value}
            onChange={(e) => onUpdate(index, "value", e.target.value)}
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
            onChange={(e) => onUpdate(index, "label", e.target.value)}
            placeholder="Display Label"
          />
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        className="mt-6"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
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

  const [validationRules, setValidationRules] = useState<ValidationRule[]>([])
  const [showAdvancedValidation, setShowAdvancedValidation] = useState(false)
  const [patternError, setPatternError] = useState<string | null>(null)

  const requiresOptions = OPTION_TYPES.includes(formData.type)
  const availableValidations = getAvailableValidations(formData.type)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const optionIds = useMemo(() => options.map((opt) => opt.id), [options])

  // Reset form when modal opens/closes or question changes
  useEffect(() => {
    if (isOpen) {
      // Migrate is_required to validation if needed
      const migratedQuestion = question ? migrateIsRequiredToValidation(question) : null
      
      setFormData({
        slug: question?.slug || "",
        type: (question?.type || "TEXT") as QuestionType,
        question: question?.question || "",
        display_question: question?.display_question || "",
        placeholder: question?.placeholder || "",
        is_required: question?.is_required || false,
        api_type: question?.api_type || "TEXT",
        validation: migratedQuestion?.validation || [],
      })
      setOptions(question?.options || [])
      
      // Initialize validation rules
      const validation = migratedQuestion?.validation || []
      const normalizedValidation: ValidationRule[] = validation.map((rule) => {
        if (typeof rule === "string") {
          return { type: rule as ValidationRuleType }
        }
        return rule as ValidationRule
      })
      setValidationRules(normalizedValidation)
      setShowAdvancedValidation(normalizedValidation.some((r) => r.type === "pattern"))
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

  const handleOptionReorder = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex((opt) => opt.id === active.id)
      const newIndex = options.findIndex((opt) => opt.id === over.id)

      const reorderedOptions = arrayMove(options, oldIndex, newIndex)
      // Update option_order
      const optionsWithOrder = reorderedOptions.map((opt, index) => ({
        ...opt,
        option_order: index + 1,
      }))
      setOptions(optionsWithOrder)
    }
  }

  const handleValidationChange = (type: ValidationRuleType, enabled: boolean, value?: string, message?: string) => {
    setPatternError(null)
    let newRules = [...validationRules]
    
    if (enabled) {
      // Add or update rule
      const existingIndex = newRules.findIndex((r) => r.type === type)
      if (existingIndex >= 0) {
        newRules[existingIndex] = { type, value, message }
      } else {
        newRules.push({ type, value, message })
      }
      
      // Validate pattern if it's a pattern rule
      if (type === "pattern" && value) {
        const patternValidation = validateRegexPattern(value)
        if (!patternValidation.valid) {
          setPatternError(patternValidation.error || "Invalid pattern")
          return
        }
      }
    } else {
      // Remove rule
      newRules = newRules.filter((r) => r.type !== type)
    }
    
    setValidationRules(newRules)
  }

  const getValidationRule = (type: ValidationRuleType): ValidationRule | undefined => {
    return validationRules.find((r) => r.type === type)
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

    // Validate pattern if present
    const patternRule = getValidationRule("pattern")
    if (patternRule && patternRule.value) {
      const patternValidation = validateRegexPattern(patternRule.value)
      if (!patternValidation.valid) {
        setPatternError(patternValidation.error || "Invalid pattern")
        alert(`Invalid regex pattern: ${patternValidation.error}`)
        return
      }
    }

    // Build validation array for save
    const validationToSave = validationRules.length > 0 ? validationRules : null

    onSave({
      ...formData,
      form_step_id: formStepId,
      question_order: question?.question_order || 0,
      options: requiresOptions ? options : undefined,
      validation: validationToSave,
      is_required: undefined, // Remove deprecated field
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleOptionReorder}
                  >
                    <SortableContext
                      items={optionIds}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {options.map((option, index) => (
                          <SortableOptionItem
                            key={option.id}
                            option={option}
                            index={index}
                            onUpdate={handleUpdateOption}
                            onRemove={handleRemoveOption}
                            canRemove={options.length > 1}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
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

          {/* Validation Rules Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Validation Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Required */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={!!getValidationRule("required")}
                    onCheckedChange={(checked) => handleValidationChange("required", checked)}
                  />
                  <Label>Required</Label>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" />
                  <span>User must provide an answer</span>
                </div>
              </div>

              {/* Email Format (for EMAIL type) */}
              {formData.type === "EMAIL" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!getValidationRule("email")}
                      onCheckedChange={(checked) => handleValidationChange("email", checked)}
                    />
                    <Label>Email Format</Label>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>Validates email format automatically</span>
                  </div>
                </div>
              )}

              {/* Phone Format (for TEL type) */}
              {formData.type === "TEL" && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={!!getValidationRule("phone")}
                        onCheckedChange={(checked) => handleValidationChange("phone", checked)}
                      />
                      <Label>Phone Format</Label>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Info className="h-3 w-3" />
                      <span>Validates phone number format</span>
                    </div>
                  </div>

                  {/* Phone Prefix */}
                  <div className="space-y-2 pl-8">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={!!getValidationRule("phonePrefix")}
                        onCheckedChange={(checked) => {
                          handleValidationChange("phonePrefix", checked, checked ? getValidationRule("phonePrefix")?.value || "+1" : undefined)
                        }}
                      />
                      <Label className="text-sm">Default Phone Prefix</Label>
                    </div>
                    {getValidationRule("phonePrefix") && (
                      <div className="space-y-1">
                        <Input
                          value={getValidationRule("phonePrefix")?.value || "+1"}
                          onChange={(e) => handleValidationChange("phonePrefix", true, e.target.value)}
                          placeholder="+1"
                          className="max-w-32"
                        />
                        <p className="text-xs text-muted-foreground">
                          Phone numbers must start with this prefix (e.g., +1, +44, +33)
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Pattern (Advanced) - for TEXT and TEXTAREA */}
              {(formData.type === "TEXT" || formData.type === "TEXTAREA") && (
                <div className="space-y-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedValidation(!showAdvancedValidation)}
                    className="flex items-center justify-between w-full text-sm font-medium text-left hover:text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <span>Advanced: Pattern (Regex)</span>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </span>
                    {showAdvancedValidation ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground pl-6">
                    Only use if you know regex patterns. Most users don't need this.
                  </p>
                  
                  {showAdvancedValidation && (
                    <div className="space-y-2 pl-6 pt-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={!!getValidationRule("pattern")}
                          onCheckedChange={(checked) => {
                            handleValidationChange("pattern", checked, checked ? getValidationRule("pattern")?.value || "" : undefined)
                          }}
                        />
                        <Label className="text-sm">Enable Pattern Validation</Label>
                      </div>
                      {getValidationRule("pattern") && (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Pattern (Regex)</Label>
                            <Input
                              value={getValidationRule("pattern")?.value || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                handleValidationChange("pattern", true, value)
                                if (value) {
                                  const validation = validateRegexPattern(value)
                                  if (!validation.valid) {
                                    setPatternError(validation.error || "Invalid pattern")
                                  } else {
                                    setPatternError(null)
                                  }
                                }
                              }}
                              placeholder="^[A-Z]+$"
                              className={patternError ? "border-destructive" : ""}
                            />
                            {patternError && (
                              <p className="text-xs text-destructive">{patternError}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Example: ^[A-Z]+$ (uppercase letters only)
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Custom Error Message (optional)</Label>
                            <Input
                              value={getValidationRule("pattern")?.message || ""}
                              onChange={(e) => handleValidationChange("pattern", true, getValidationRule("pattern")?.value, e.target.value)}
                              placeholder="Value does not match the required pattern"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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

