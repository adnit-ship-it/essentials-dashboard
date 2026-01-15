"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, AlertTriangle, Info, CheckCircle2, List, Hash, Mail, Phone, FileText, CheckSquare } from "lucide-react"
import type { RenderCondition, ConditionOperator, LogicalOperator, FullQuiz, QuestionType } from "@/lib/types/quiz"
import { OPTION_TYPES } from "@/lib/types/quiz"
import { getAvailableQuestionsForFormStep, validateConditionalRendering } from "@/lib/utils/quiz-helpers"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

interface ConditionalRenderingEditorProps {
  condition: RenderCondition | null
  quiz: FullQuiz
  currentFormStepId: string
  onChange: (condition: RenderCondition | null) => void
}

export function ConditionalRenderingEditor({
  condition,
  quiz,
  currentFormStepId,
  onChange,
}: ConditionalRenderingEditorProps) {
  const [localCondition, setLocalCondition] = useState<RenderCondition>(
    condition || {
      conditions: [],
      logicalOperator: "AND",
    }
  )

  // Get available questions for this form step
  const availableQuestions = useMemo(() => {
    return getAvailableQuestionsForFormStep(quiz, currentFormStepId)
  }, [quiz, currentFormStepId])

  // Validate current condition
  const validation = useMemo(() => {
    return validateConditionalRendering(quiz, currentFormStepId, localCondition)
  }, [quiz, currentFormStepId, localCondition])

  // Update local condition when prop changes and validate it
  useEffect(() => {
    if (condition) {
      // Validate the condition before setting it
      const validation = validateConditionalRendering(quiz, currentFormStepId, condition)
      if (!validation.valid) {
        // Clear invalid condition automatically
        console.warn("Clearing invalid condition on step:", currentFormStepId, validation.errors)
        toast.warning("Invalid condition cleared", {
          description: "The condition referenced questions from current or future steps and has been removed.",
        })
        setLocalCondition({
          conditions: [],
          logicalOperator: "AND",
        })
        // Clear the invalid condition from the parent
        onChange(null)
      } else {
        setLocalCondition(condition)
      }
    } else {
      setLocalCondition({
        conditions: [],
        logicalOperator: "AND",
      })
    }
  }, [condition, quiz, currentFormStepId, onChange])

  const handleAddCondition = () => {
    setLocalCondition({
      ...localCondition,
      conditions: [
        ...localCondition.conditions,
        {
          field: availableQuestions[0]?.slug || "",
          operator: "equals",
          value: "",
        },
      ],
    })
  }

  const handleRemoveCondition = (index: number) => {
    const newConditions = localCondition.conditions.filter((_, i) => i !== index)
    setLocalCondition({
      ...localCondition,
      conditions: newConditions,
    })
  }

  const handleUpdateCondition = (
    index: number,
    field: "field" | "operator" | "value",
    value: any
  ) => {
    const newConditions = [...localCondition.conditions]
    newConditions[index] = {
      ...newConditions[index],
      [field]: value,
    }
    const updatedCondition = {
      ...localCondition,
      conditions: newConditions,
    }
    setLocalCondition(updatedCondition)
    // Immediately notify parent of changes
    onChange(updatedCondition)
  }

  const handleMultiSelectChange = (index: number, optionValue: string, checked: boolean) => {
    const cond = localCondition.conditions[index]
    const currentValue = Array.isArray(cond.value) ? cond.value : cond.value ? [cond.value] : []
    
    let newValue: string[]
    if (checked) {
      newValue = [...currentValue, optionValue]
    } else {
      newValue = currentValue.filter((v) => v !== optionValue)
    }
    
    handleUpdateCondition(index, "value", newValue)
  }

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case "MULTISELECT":
      case "SINGLESELECT":
      case "DROPDOWN":
        return <List className="h-4 w-4" />
      case "NUMBER":
        return <Hash className="h-4 w-4" />
      case "EMAIL":
        return <Mail className="h-4 w-4" />
      case "TEL":
        return <Phone className="h-4 w-4" />
      case "TEXTAREA":
        return <FileText className="h-4 w-4" />
      case "CHECKBOX":
        return <CheckSquare className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getConditionPreview = (cond: { field: string; operator: string; value: any }) => {
    const question = availableQuestions.find((q) => q.slug === cond.field)
    if (!question) return ""
    
    const questionText = question.question
    const operatorText = cond.operator === "equals" ? "equals" : 
                        cond.operator === "notEquals" ? "does not equal" :
                        cond.operator === "greaterThan" ? "is greater than" :
                        cond.operator === "lessThan" ? "is less than" : cond.operator
    
    if (Array.isArray(cond.value)) {
      const values = cond.value.map((v) => {
        const option = question.options?.find((opt) => opt.value === v)
        return option?.label || option?.value || v
      }).join(", ")
      return `${questionText} ${operatorText} [${values}]`
    }
    
    const valueText = cond.value || "[not set]"
    return `${questionText} ${operatorText} "${valueText}"`
  }

  const handleSave = () => {
    if (localCondition.conditions.length === 0) {
      onChange(null)
      toast.success("Condition cleared")
      return
    }

    // Validate before saving - prevent saving invalid conditions
    const validationResult = validateConditionalRendering(quiz, currentFormStepId, localCondition)
    if (!validationResult.valid) {
      // Don't save if invalid - show error
      console.error("Cannot save invalid conditional rendering:", validationResult.errors)
      toast.error("Cannot save condition", {
        description: validationResult.errors.join(". "),
      })
      return
    }

    onChange(localCondition)
    toast.success("Condition saved successfully")
  }

  // Check if a condition field is invalid
  const isFieldInvalid = (fieldSlug: string) => {
    return !availableQuestions.some((q) => q.slug === fieldSlug)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conditional Rendering</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Control when this form step is shown based on answers from previous questions.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Invalid Conditions:</div>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {availableQuestions.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">No Prior Questions Available</div>
              <p className="text-sm">
                This form step will always be shown because there are no previous questions to reference.
                Add questions to earlier steps to enable conditional rendering.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {availableQuestions.length > 0 && localCondition.conditions.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">No Conditions Set</div>
              <p className="text-sm">
                This form step will always be shown. Add conditions below to control when it appears.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {localCondition.conditions.length > 0 && (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
          <Label>Logical Operator</Label>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>How to combine multiple conditions</span>
              </div>
            </div>
          <Select
            value={localCondition.logicalOperator}
            onValueChange={(value: LogicalOperator) =>
              setLocalCondition({
                ...localCondition,
                logicalOperator: value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND (all conditions must be true)</SelectItem>
              <SelectItem value="OR">OR (any condition must be true)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
          <Label>Conditions</Label>
            {localCondition.conditions.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>You can only reference questions from previous steps</span>
              </div>
            )}
          </div>
          {localCondition.conditions.map((cond, index) => {
            const fieldInvalid = isFieldInvalid(cond.field)
            const selectedQuestion = availableQuestions.find((q) => q.slug === cond.field)
            const questionHasOptions = selectedQuestion && OPTION_TYPES.includes(selectedQuestion.type) && selectedQuestion.options && selectedQuestion.options.length > 0
            const isMultiSelect = selectedQuestion?.type === "MULTISELECT"
            const shouldShowDropdown = questionHasOptions && (cond.operator === "equals" || cond.operator === "notEquals") && !isMultiSelect
            const shouldShowCheckboxes = isMultiSelect && (cond.operator === "equals" || cond.operator === "notEquals")
            const currentValue = Array.isArray(cond.value) ? cond.value : cond.value ? [cond.value] : []
            const preview = getConditionPreview(cond)
            
            return (
              <div key={index} className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Question</Label>
                  <Select
                    value={cond.field}
                    onValueChange={(value) => {
                      // Update field and clear value in a single update
                      const newConditions = [...localCondition.conditions]
                      newConditions[index] = {
                        ...newConditions[index],
                        field: value,
                        value: "",
                      }
                      const updatedCondition = {
                        ...localCondition,
                        conditions: newConditions,
                      }
                      setLocalCondition(updatedCondition)
                      onChange(updatedCondition)
                    }}
                  >
                    <SelectTrigger className={cn(fieldInvalid && "border-destructive")}>
                          <SelectValue placeholder="Select question" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {availableQuestions.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No previous questions available
                        </div>
                      ) : (
                        availableQuestions.map((field) => (
                          <SelectItem key={field.id} value={field.slug}>
                            <div className="flex items-center gap-2">
                              {getQuestionTypeIcon(field.type)}
                              <div className="flex flex-col">
                                <span>{field.question}</span>
                                <span className="text-xs text-muted-foreground">
                                  {field.progressStepName} → {field.formStepTitle}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {fieldInvalid && cond.field && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                      This question is not available (from current or future step)
                    </p>
                  )}
                      {selectedQuestion && !fieldInvalid && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {selectedQuestion.type === "MULTISELECT" 
                            ? "Multi-select question - select multiple options"
                            : questionHasOptions
                            ? "Select an option from the dropdown"
                            : selectedQuestion.type === "NUMBER"
                            ? "Enter a number value"
                            : "Enter the value to match"}
                        </p>
                      )}
                </div>
                    
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Operator</Label>
                  <Select
                    value={cond.operator}
                        onValueChange={(value: ConditionOperator) => {
                          const willShowDropdown = questionHasOptions && (value === "equals" || value === "notEquals") && !isMultiSelect
                          const willShowCheckboxes = isMultiSelect && (value === "equals" || value === "notEquals")
                          
                      handleUpdateCondition(index, "operator", value)
                          if (shouldShowDropdown !== willShowDropdown || shouldShowCheckboxes !== (isMultiSelect && (cond.operator === "equals" || cond.operator === "notEquals"))) {
                            handleUpdateCondition(index, "value", isMultiSelect ? [] : "")
                    }
                        }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">equals</SelectItem>
                      <SelectItem value="notEquals">not equals</SelectItem>
                          {!questionHasOptions && (
                            <>
                      <SelectItem value="greaterThan">greater than</SelectItem>
                      <SelectItem value="lessThan">less than</SelectItem>
                            </>
                          )}
                    </SelectContent>
                  </Select>
                      {selectedQuestion && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {questionHasOptions
                            ? "Use 'equals' or 'not equals' to match option values"
                            : selectedQuestion.type === "NUMBER"
                            ? "Use 'greater than' or 'less than' for numeric comparisons"
                            : "Use 'equals' for exact text matches"}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Value</Label>
                      {shouldShowCheckboxes ? (
                        <div className="space-y-2 p-3 border rounded-md bg-background">
                          {selectedQuestion?.options && selectedQuestion.options.length > 0 ? (
                            <>
                              <div className="space-y-2">
                                {selectedQuestion.options.map((option) => {
                                  const isChecked = currentValue.includes(option.value)
                                  return (
                                    <div key={option.id} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`option-${index}-${option.id}`}
                                        checked={isChecked}
                                        onChange={(e) => handleMultiSelectChange(index, option.value, e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300"
                                      />
                                      <label
                                        htmlFor={`option-${index}-${option.id}`}
                                        className="text-sm cursor-pointer flex-1"
                                      >
                                        {option.label || option.value}
                                      </label>
                                    </div>
                                  )
                                })}
                              </div>
                              {currentValue.length > 0 && (
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <span className="text-xs text-muted-foreground">
                                    {currentValue.length} option{currentValue.length !== 1 ? "s" : ""} selected
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateCondition(index, "value", [])}
                                    className="h-7 text-xs"
                                  >
                                    Clear Selection
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">No options available</p>
                          )}
                </div>
                      ) : shouldShowDropdown ? (
                        <Select
                          value={typeof cond.value === "string" ? cond.value : ""}
                          onValueChange={(value) =>
                            handleUpdateCondition(index, "value", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedQuestion?.options?.map((option) => (
                              <SelectItem key={option.id} value={option.value}>
                                {option.label || option.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                  <Input
                          value={typeof cond.value === "string" ? cond.value : Array.isArray(cond.value) ? cond.value.join(", ") : ""}
                    onChange={(e) =>
                      handleUpdateCondition(index, "value", e.target.value)
                    }
                          placeholder={
                            selectedQuestion?.type === "NUMBER"
                              ? "Enter number (e.g., 25)"
                              : "Enter value (e.g., Yes)"
                          }
                          type={selectedQuestion?.type === "NUMBER" ? "number" : "text"}
                        />
                      )}
                      {selectedQuestion && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedQuestion.type === "NUMBER"
                            ? "Example: 25"
                            : "Example: 'Yes' or 'No'"}
                        </p>
                      )}
                    </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCondition(index)}
                    className="mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                </div>
                
                {preview && !fieldInvalid && (
                  <div className="flex items-start gap-2 p-2 bg-background rounded border border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-green-900 mb-1">Preview:</p>
                      <p className="text-xs text-green-700">
                        Show this step if {preview}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <Button 
            type="button" 
            onClick={handleAddCondition} 
            variant="outline" 
            size="sm"
            disabled={availableQuestions.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>

        {localCondition.conditions.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm font-medium mb-2">Summary:</p>
            <p className="text-sm text-muted-foreground">
              This step will be shown when{" "}
              <span className="font-medium">
                {localCondition.logicalOperator === "AND" ? "all" : "any"}{" "}
              </span>
              of the following conditions are met:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm text-muted-foreground">
              {localCondition.conditions.map((cond, idx) => {
                const preview = getConditionPreview(cond)
                return preview ? <li key={idx}>{preview}</li> : null
              })}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {localCondition.conditions.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLocalCondition({
                  conditions: [],
                  logicalOperator: "AND",
                })
                onChange(null)
                toast.success("Conditions cleared")
              }}
            >
              Clear All
            </Button>
          )}
          <Button onClick={handleSave} disabled={localCondition.conditions.length === 0}>
            {localCondition.conditions.length === 0 ? "No Conditions Set" : "Save Conditions"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}




