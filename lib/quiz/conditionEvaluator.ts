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

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value
    case "notEquals":
      return fieldValue !== condition.value
    case "greaterThan":
      return Number(fieldValue) > Number(condition.value)
    case "lessThan":
      return Number(fieldValue) < Number(condition.value)
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




