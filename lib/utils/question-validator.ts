/**
 * Validation utilities for questions
 */

import type { Question, QuestionType } from "@/lib/types/quiz"
import { VALIDATION_RULES_BY_TYPE } from "@/lib/types/quiz"

/**
 * Get available validation rules for a question type
 */
export function getAvailableValidations(questionType: QuestionType): string[] {
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
    // Check required field
    if (question.required && (!value || (Array.isArray(value) && value.length === 0))) {
      errors.push("This field is required")
    }
    return { valid: errors.length === 0, errors }
  }

  question.validation.forEach((rule) => {
    switch (rule) {
      case "required":
        if (!value || (Array.isArray(value) && value.length === 0)) {
          errors.push("This field is required")
        }
        break

      case "email":
        if (value && typeof value === "string") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            errors.push("Please enter a valid email address")
          }
        }
        break

      case "phone":
        if (value && typeof value === "string") {
          // Basic phone validation - accepts digits, spaces, dashes, parentheses, plus
          const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
          if (!phoneRegex.test(value.replace(/\s/g, ""))) {
            errors.push("Please enter a valid phone number")
          }
        }
        break

      case "phonePrefix":
        // Phone prefix validation would need additional metadata
        // For now, just check if value exists
        break

      case "pattern":
        // Pattern validation would need additional metadata (the regex pattern)
        // For now, skip - this should be handled at the form level
        break
    }
  })

  // Also check required field if validation array doesn't include it
  if (!question.validation.includes("required") && question.required) {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      errors.push("This field is required")
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Migrate is_required field to validation array and ensure required field is set
 * This function normalizes questions to the new format
 */
export function migrateIsRequiredToValidation(question: any): Question {
  const currentValidation = question.validation || []
  
  // Convert validation to string array if it's in old format
  let normalizedValidation: string[] = []
  if (Array.isArray(currentValidation)) {
    normalizedValidation = currentValidation.map((rule: any) => {
      if (typeof rule === "string") {
        return rule
      }
      if (typeof rule === "object" && rule.type) {
        return rule.type
      }
      return String(rule)
    })
  }

  // Handle legacy is_required field
  if (question.is_required !== undefined) {
    const hasRequired = normalizedValidation.includes("required")
    
    if (question.is_required && !hasRequired) {
      normalizedValidation.unshift("required")
    } else if (!question.is_required && hasRequired) {
      normalizedValidation = normalizedValidation.filter((r) => r !== "required")
    }
  }

  // Ensure required field is set based on validation array
  const required = normalizedValidation.includes("required")

  return {
    ...question,
    required,
    validation: normalizedValidation.length > 0 ? normalizedValidation : null,
  }
}
