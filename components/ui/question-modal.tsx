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
import type { Question, QuestionType, QuestionOption } from "@/lib/types/quiz"
import { QUESTION_TYPE_CONFIGS, OPTION_TYPES } from "@/lib/types/quiz"
import { getAvailableValidations, validateRegexPattern, migrateIsRequiredToValidation } from "@/lib/utils/question-validator"
import { QuizImageUpload } from "./question-modal/quiz-image-upload"
import { CalculatedValuesEditor } from "./question-modal/calculated-values-editor"
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
            value={option.value || ""}
            onChange={(e) => onUpdate(index, "value", e.target.value)}
            placeholder="option-value"
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Display Label
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
    displayQuestion: question?.displayQuestion || "",
    placeholder: question?.placeholder || "",
    required: question?.required ?? false,
    api_type: question?.api_type || "TEXT",
    validation: question?.validation || [],
    // General fields
    icon: question?.icon || "",
    displayAsRow: question?.displayAsRow || false,
    optionImages: question?.optionImages || [],
    // MARKETING fields
    image: question?.image || "",
    displayStatistics: question?.displayStatistics || false,
    // BEFORE_AFTER fields
    beforeImage: question?.beforeImage || "",
    afterImage: question?.afterImage || "",
    quote: question?.quote || "",
    // MEDICAL_REVIEW fields
    calculatedValues: question?.calculatedValues || {},
    candidateStatement: question?.candidateStatement || "",
    // PERFECT fields
    heading1: question?.heading1 || "",
    subtext: question?.subtext || "",
    dynamicSubtext: question?.dynamicSubtext || "",
  })

  const [options, setOptions] = useState<QuestionOption[]>(
    question?.options || []
  )

  const [validationRules, setValidationRules] = useState<string[]>([])
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
        displayQuestion: question?.displayQuestion || "",
        placeholder: question?.placeholder || "",
        required: migratedQuestion?.required ?? false,
        api_type: question?.api_type || "TEXT",
        validation: migratedQuestion?.validation || [],
        // General fields
        icon: question?.icon || "",
        displayAsRow: question?.displayAsRow || false,
        optionImages: question?.optionImages || [],
        // MARKETING fields
        image: question?.image || "",
        displayStatistics: question?.displayStatistics || false,
        // BEFORE_AFTER fields
        beforeImage: question?.beforeImage || "",
        afterImage: question?.afterImage || "",
        quote: question?.quote || "",
        // MEDICAL_REVIEW fields
        calculatedValues: question?.calculatedValues || {},
        candidateStatement: question?.candidateStatement || "",
        // PERFECT fields
        heading1: question?.heading1 || "",
        subtext: question?.subtext || "",
        dynamicSubtext: question?.dynamicSubtext || "",
      })
      const questionOptions = question?.options || []
      setOptions(questionOptions)
      
      // Initialize optionImages array to match options length
      const questionOptionImages = question?.optionImages || []
      const optionImagesArray = questionOptions.map((_, index) => questionOptionImages[index] || "")
      setFormData((prev) => ({
        ...prev,
        optionImages: optionImagesArray,
      }))
      
      // Initialize validation rules
      const validation = migratedQuestion?.validation || []
      setValidationRules(validation)
      setShowAdvancedValidation(validation.includes("pattern"))
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
      // Initialize optionImages array
      setFormData((prev) => ({
        ...prev,
        optionImages: [""],
      }))
    } else if (!requiresOptions && options.length > 0) {
      // Switching away from option type - clear options
      setOptions([])
      setFormData((prev) => ({
        ...prev,
        optionImages: [],
        displayAsRow: false,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type])

  // Sync optionImages array with options array
  useEffect(() => {
    if (requiresOptions) {
      const currentLength = formData.optionImages.length
      const optionsLength = options.length
      
      if (currentLength < optionsLength) {
        // Add empty strings for new options
        const newOptionImages = [...formData.optionImages]
        while (newOptionImages.length < optionsLength) {
          newOptionImages.push("")
        }
        setFormData((prev) => ({ ...prev, optionImages: newOptionImages }))
      } else if (currentLength > optionsLength) {
        // Remove excess images
        const newOptionImages = formData.optionImages.slice(0, optionsLength)
        setFormData((prev) => ({ ...prev, optionImages: newOptionImages }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length, requiresOptions])

  const handleAddOption = () => {
    const newOption: QuestionOption = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      question_id: formStepId,
      value: "",
      label: null,
      option_order: options.length + 1,
    }
    setOptions([...options, newOption])
    // Add empty string to optionImages array
    setFormData((prev) => ({
      ...prev,
      optionImages: [...prev.optionImages, ""],
    }))
  }

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index).map((opt, i) => ({
      ...opt,
      option_order: i + 1,
    }))
    setOptions(newOptions)
    // Remove corresponding image from optionImages array
    const newOptionImages = formData.optionImages.filter((_, i) => i !== index)
    setFormData((prev) => ({
      ...prev,
      optionImages: newOptionImages,
    }))
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
      
      // Reorder optionImages array to match
      const reorderedImages = arrayMove(formData.optionImages, oldIndex, newIndex)
      setFormData((prev) => ({
        ...prev,
        optionImages: reorderedImages,
      }))
    }
  }

  const handleValidationChange = (type: string, enabled: boolean, value?: string) => {
    setPatternError(null)
    let newRules = [...validationRules]
    
    if (enabled) {
      // Add rule if not already present
      if (!newRules.includes(type)) {
        newRules.push(type)
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
      newRules = newRules.filter((r) => r !== type)
    }
    
    setValidationRules(newRules)
  }

  const hasValidationRule = (type: string): boolean => {
    return validationRules.includes(type)
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

    // Build validation array for save
    const validationToSave = validationRules.length > 0 ? validationRules : null

    // Build question object with conditional fields based on type
    const questionToSave: Partial<Question> = {
      ...formData,
      question: formData.question, // Explicitly include question field
      form_step_id: formStepId,
      question_order: question?.question_order || 0,
      options: requiresOptions ? options : undefined,
      validation: validationToSave,
    }

    // Add type-specific fields
    if (formData.type === "MARKETING") {
      questionToSave.image = formData.image || null
      questionToSave.displayStatistics = formData.displayStatistics || false
    }

    if (formData.type === "BEFORE_AFTER") {
      questionToSave.beforeImage = formData.beforeImage || null
      questionToSave.afterImage = formData.afterImage || null
      questionToSave.quote = formData.quote || null
    }

    if (formData.type === "MEDICAL_REVIEW") {
      questionToSave.calculatedValues = Object.keys(formData.calculatedValues).length > 0 
        ? formData.calculatedValues 
        : undefined
      questionToSave.candidateStatement = formData.candidateStatement || null
    }

    if (formData.type === "PERFECT") {
      questionToSave.heading1 = formData.heading1 || null
      questionToSave.subtext = formData.subtext || null
      questionToSave.dynamicSubtext = formData.dynamicSubtext || null
    }

    // Add general fields
    if (formData.icon) {
      questionToSave.icon = formData.icon || null
    }
    if (requiresOptions) {
      questionToSave.displayAsRow = formData.displayAsRow || false
      if (formData.optionImages.length > 0) {
        questionToSave.optionImages = formData.optionImages
      }
    }

    onSave(questionToSave)
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
              value={formData.slug ?? ""}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g., email-address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Question Text *</Label>
            <Input
              id="question"
              value={formData.question ?? ""}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="What is your email?"
              required
            />
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="displayQuestion">Display Question</Label>
            <Input
              id="displayQuestion"
              value={formData.displayQuestion}
              onChange={(e) =>
                setFormData({ ...formData, displayQuestion: e.target.value })
              }
              placeholder="Email Address"
            />
          </div> */}

          {!requiresOptions && (
          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={formData.placeholder ?? ""}
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
                    checked={hasValidationRule("required")}
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
                      checked={hasValidationRule("email")}
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
                        checked={hasValidationRule("phone")}
                        onCheckedChange={(checked) => handleValidationChange("phone", checked)}
                      />
                      <Label>Phone Format</Label>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Info className="h-3 w-3" />
                      <span>Validates phone number format</span>
                    </div>
                  </div>

                  {/* Phone Prefix - Note: File format doesn't support storing prefix value */}
                  <div className="space-y-2 pl-8">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={hasValidationRule("phonePrefix")}
                        onCheckedChange={(checked) => handleValidationChange("phonePrefix", checked)}
                      />
                      <Label className="text-sm">Default Phone Prefix</Label>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      Note: Prefix value cannot be stored in current file format
                    </p>
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
                          checked={hasValidationRule("pattern")}
                          onCheckedChange={(checked) => handleValidationChange("pattern", checked)}
                        />
                        <Label className="text-sm">Enable Pattern Validation</Label>
                      </div>
                      {hasValidationRule("pattern") && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Note: Pattern regex value cannot be stored in current file format. This validation will be enabled but pattern matching cannot be configured.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
          </div>
              )}
            </CardContent>
          </Card>

          {/* Display Options Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Display Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Icon */}
              <QuizImageUpload
                label="Icon"
                value={formData.icon ?? ""}
                onChange={(value) => setFormData({ ...formData, icon: value })}
              />

              {/* Display As Row - only for option types */}
              {requiresOptions && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.displayAsRow}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, displayAsRow: checked })
                      }
                    />
                    <Label>Display Options in Row</Label>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>Show options horizontally instead of vertically</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Option Images - only for option types */}
          {requiresOptions && options.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Option Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="space-y-2">
                    <Label className="text-xs">
                      Image for "{option.value || `Option ${index + 1}`}"
                    </Label>
                    <QuizImageUpload
                      label=""
                      value={formData.optionImages[index] || ""}
                      onChange={(value) => {
                        const newOptionImages = [...formData.optionImages]
                        newOptionImages[index] = value
                        setFormData({ ...formData, optionImages: newOptionImages })
                      }}
                      onDelete={() => {
                        const newOptionImages = [...formData.optionImages]
                        newOptionImages[index] = ""
                        setFormData({ ...formData, optionImages: newOptionImages })
                      }}
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Add images for each option. Images will be displayed in the same order as options.
                </p>
              </CardContent>
            </Card>
          )}

          {/* MARKETING Type Fields */}
          {formData.type === "MARKETING" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Marketing Question Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <QuizImageUpload
                  label="Marketing Image"
                  value={formData.image ?? ""}
                  onChange={(value) => setFormData({ ...formData, image: value })}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.displayStatistics}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, displayStatistics: checked })
                      }
                    />
                    <Label>Display Statistics</Label>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>Show statistics display on marketing question</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BEFORE_AFTER Type Fields */}
          {formData.type === "BEFORE_AFTER" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Before/After Question Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <QuizImageUpload
                  label="Before Image"
                  value={formData.beforeImage ?? ""}
                  onChange={(value) => setFormData({ ...formData, beforeImage: value })}
                />
                <QuizImageUpload
                  label="After Image"
                  value={formData.afterImage ?? ""}
                  onChange={(value) => setFormData({ ...formData, afterImage: value })}
                />
                <div className="space-y-2">
                  <Label htmlFor="quote">Testimonial Quote</Label>
                  <Textarea
                    id="quote"
                    value={formData.quote ?? ""}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    placeholder="I lost 30 pounds in 3 months!"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Testimonial quote to display with the before/after images
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* MEDICAL_REVIEW Type Fields */}
          {formData.type === "MEDICAL_REVIEW" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Medical Review Question Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CalculatedValuesEditor
                  value={formData.calculatedValues}
                  onChange={(value) => setFormData({ ...formData, calculatedValues: value })}
                />
                <div className="space-y-2">
                  <Label htmlFor="candidateStatement">Candidate Statement</Label>
                  <Textarea
                    id="candidateStatement"
                    value={formData.candidateStatement ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, candidateStatement: e.target.value })
                    }
                    placeholder="Based on your responses, you are a good candidate for this treatment."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Statement about the candidate's eligibility based on their responses
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PERFECT Type Fields */}
          {formData.type === "PERFECT" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Perfect Match Question Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="heading1">Main Heading</Label>
                  <Input
                    id="heading1"
                    value={formData.heading1 ?? ""}
                    onChange={(e) => setFormData({ ...formData, heading1: e.target.value })}
                    placeholder="You're a Perfect Match!"
                  />
                  <p className="text-xs text-muted-foreground">
                    Main heading displayed on the perfect match screen
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtext">Subtext</Label>
                  <Textarea
                    id="subtext"
                    value={formData.subtext ?? ""}
                    onChange={(e) => setFormData({ ...formData, subtext: e.target.value })}
                    placeholder="Based on your responses, this treatment is ideal for you."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Subtext displayed below the heading
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dynamicSubtext">Dynamic Subtext</Label>
                  <Textarea
                    id="dynamicSubtext"
                    value={formData.dynamicSubtext ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dynamicSubtext: e.target.value })
                    }
                    placeholder="Your goal weight of {{goalWeight}}lbs is achievable!"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Dynamic subtext with template variables. Use double curly braces for variables, e.g., {"{{goalWeight}}"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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

