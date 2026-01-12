/**
 * Condition evaluator for conditional rendering of form steps
 */

import type { RenderCondition } from "@/lib/types/quiz"

/**
 * Evaluate a single condition against form data
 */
function evaluateCondition(
  condition: { field: string; operator: string; value: any },
  formData: Record<string, any>
): boolean {
  const fieldValue = formData[condition.field]
  const conditionValue = condition.value

  switch (condition.operator) {
    case "equals":
      // Handle multi-select: condition value is array, check if fieldValue contains all condition values
      if (Array.isArray(conditionValue)) {
        if (!Array.isArray(fieldValue)) {
          return false
        }
        // For MULTISELECT: fieldValue must contain all values in conditionValue
        return conditionValue.every((val) => fieldValue.includes(val))
      }
      // Single value comparison
      return fieldValue === conditionValue
      
    case "notEquals":
      // Handle multi-select: condition value is array, check if fieldValue doesn't contain any condition values
      if (Array.isArray(conditionValue)) {
        if (!Array.isArray(fieldValue)) {
          return true // If field is not an array but condition expects array, it's not equal
        }
        // For MULTISELECT: fieldValue should not contain any values in conditionValue
        return !conditionValue.some((val) => fieldValue.includes(val))
      }
      // Single value comparison
      return fieldValue !== conditionValue
      
    case "greaterThan":
      return Number(fieldValue) > Number(conditionValue)
    case "lessThan":
      return Number(fieldValue) < Number(conditionValue)
    default:
      return false
  }
}

/**
 * Evaluate render conditions against form data
 */
export function evaluateRenderCondition(
  condition: RenderCondition | null,
  formData: Record<string, any>
): boolean {
  if (!condition || !condition.conditions || condition.conditions.length === 0) {
    return true // No conditions means always show
  }

  const results = condition.conditions.map((c) => evaluateCondition(c, formData))

  if (condition.logicalOperator === "AND") {
    return results.every((r) => r === true)
  } else if (condition.logicalOperator === "OR") {
    return results.some((r) => r === true)
  }

  return true // Default to showing if operator is unknown
}

/**
 * Check if a step should be visible based on its render condition
 */
export function shouldShowStep(
  renderCondition: RenderCondition | null,
  formData: Record<string, any>
): boolean {
  return evaluateRenderCondition(renderCondition, formData)
}




