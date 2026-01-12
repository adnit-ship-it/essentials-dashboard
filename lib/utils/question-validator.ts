/**
 * Validation utilities for questions
 */

import type { Question, QuestionType, ValidationRule, ValidationRuleType } from "@/lib/types/quiz"
import { VALIDATION_RULES_BY_TYPE } from "@/lib/types/quiz"

/**
 * Get available validation rules for a question type
 */
export function getAvailableValidations(questionType: QuestionType): ValidationRuleType[] {
  return VALIDATION_RULES_BY_TYPE[questionType] || []
}

/**
 * Validate a regex pattern
 */
export function validateRegexPattern(pattern: string): { valid: boolean; error?: string } {
  if (!pattern || pattern.trim() === "") {
    return { valid: false, error: "Pattern cannot be empty" }
  }

  try {
    new RegExp(pattern)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: `Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * Validate a question response against its validation rules
 */
export function validateQuestionResponse(
  question: Question,
  value: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!question.validation || question.validation.length === 0) {
    // Check legacy is_required for backward compatibility
    if (question.is_required && (!value || (Array.isArray(value) && value.length === 0))) {
      errors.push("This field is required")
    }
    return { valid: errors.length === 0, errors }
  }

  question.validation.forEach((rule) => {
    switch (rule.type) {
      case "required":
        if (!value || (Array.isArray(value) && value.length === 0)) {
          errors.push(rule.message || "This field is required")
        }
        break

      case "email":
        if (value && typeof value === "string") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            errors.push(rule.message || "Please enter a valid email address")
          }
        }
        break

      case "phone":
        if (value && typeof value === "string") {
          // Basic phone validation - accepts digits, spaces, dashes, parentheses, plus
          const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
          if (!phoneRegex.test(value.replace(/\s/g, ""))) {
            errors.push(rule.message || "Please enter a valid phone number")
          }
        }
        break

      case "phonePrefix":
        if (value && typeof value === "string" && rule.value) {
          const prefix = rule.value.trim()
          if (!value.startsWith(prefix)) {
            errors.push(rule.message || `Phone number must start with ${prefix}`)
          }
        }
        break

      case "pattern":
        if (value && typeof value === "string" && rule.value) {
          try {
            const regex = new RegExp(rule.value)
            if (!regex.test(value)) {
              errors.push(rule.message || "Value does not match the required pattern")
            }
          } catch (error) {
            // Invalid regex pattern - skip this validation
            console.warn("Invalid regex pattern in validation rule:", rule.value, error)
          }
        }
        break
    }
  })

  return { valid: errors.length === 0, errors }
}

/**
 * Migrate is_required field to validation array
 */
export function migrateIsRequiredToValidation(question: Question): Question {
  // If validation already exists and has required, or is_required is false, return as-is
  if (question.validation && question.validation.length > 0) {
    const hasRequired = question.validation.some(
      (rule) => (typeof rule === "string" && rule === "required") || (typeof rule === "object" && rule.type === "required")
    )
    if (hasRequired || !question.is_required) {
      // Normalize validation array to use ValidationRule interface
      const normalizedValidation: ValidationRule[] = question.validation.map((rule) => {
        if (typeof rule === "string") {
          // Legacy string format
          return { type: rule as ValidationRuleType }
        }
        return rule as ValidationRule
      })
      return { ...question, validation: normalizedValidation }
    }
  }

  // Migrate is_required to validation array
  if (question.is_required) {
    const existingValidation = question.validation || []
    const normalizedValidation: ValidationRule[] = existingValidation.map((rule) => {
      if (typeof rule === "string") {
        return { type: rule as ValidationRuleType }
      }
      return rule as ValidationRule
    })

    // Add required if not already present
    const hasRequired = normalizedValidation.some((rule) => rule.type === "required")
    if (!hasRequired) {
      normalizedValidation.unshift({ type: "required" })
    }

    return {
      ...question,
      validation: normalizedValidation,
      is_required: undefined, // Remove deprecated field
    }
  }

  // Normalize existing validation array
  if (question.validation && question.validation.length > 0) {
    const normalizedValidation: ValidationRule[] = question.validation.map((rule) => {
      if (typeof rule === "string") {
        return { type: rule as ValidationRuleType }
      }
      return rule as ValidationRule
    })
    return { ...question, validation: normalizedValidation }
  }

  return question
}
