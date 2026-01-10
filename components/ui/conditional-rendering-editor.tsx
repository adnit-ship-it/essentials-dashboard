"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, AlertTriangle } from "lucide-react"
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
    setLocalCondition({
      ...localCondition,
      conditions: newConditions,
    })
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
              No prior form steps available. This form step will always be shown.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Logical Operator</Label>
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

        <div className="space-y-2">
          <Label>Conditions</Label>
          {localCondition.conditions.map((cond, index) => {
            const fieldInvalid = isFieldInvalid(cond.field)
            const selectedQuestion = availableQuestions.find((q) => q.slug === cond.field)
            const questionHasOptions = selectedQuestion && OPTION_TYPES.includes(selectedQuestion.type) && selectedQuestion.options && selectedQuestion.options.length > 0
            const shouldShowDropdown = questionHasOptions && (cond.operator === "equals" || cond.operator === "notEquals")
            
            return (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    value={cond.field}
                    onValueChange={(value) => {
                      // When field changes, reset value to allow proper selection for new field type
                      handleUpdateCondition(index, "field", value)
                      handleUpdateCondition(index, "value", "")
                    }}
                  >
                    <SelectTrigger className={cn(fieldInvalid && "border-destructive")}>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableQuestions.map((field) => (
                        <SelectItem key={field.id} value={field.slug}>
                          {field.question} - {field.progressStepName}: {field.formStepTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldInvalid && cond.field && (
                    <p className="text-xs text-destructive mt-1">
                      This question is not available (from current or future step)
                    </p>
                  )}
                </div>
                <div className="w-32">
                  <Select
                    value={cond.operator}
                    onValueChange={(value: ConditionOperator) => {
                      // When operator changes, reset value if switching between option and non-option modes
                      const willShowDropdown = questionHasOptions && (value === "equals" || value === "notEquals")
                      
                      handleUpdateCondition(index, "operator", value)
                      if (shouldShowDropdown !== willShowDropdown) {
                        handleUpdateCondition(index, "value", "")
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
                </div>
                <div className="flex-1">
                  {shouldShowDropdown ? (
                    <Select
                      value={cond.value}
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
                      value={cond.value}
                      onChange={(e) =>
                        handleUpdateCondition(index, "value", e.target.value)
                      }
                      placeholder={selectedQuestion?.type === "NUMBER" ? "Enter number" : "Enter value"}
                      type={selectedQuestion?.type === "NUMBER" ? "number" : "text"}
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCondition(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Conditions</Button>
        </div>
      </CardContent>
    </Card>
  )
}




