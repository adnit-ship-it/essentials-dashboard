/**
 * Validation utilities for form inputs
 */

/**
 * Validates if a string is a valid height value (number + "px")
 */
export function isValidHeight(value: string): boolean {
  if (!value) return true // Empty is allowed (will be set to default)
  const trimmed = value.trim()
  if (trimmed === "") return true
  // Match pattern: number followed by "px"
  const heightPattern = /^\d+(\.\d+)?px$/i
  return heightPattern.test(trimmed)
}

/**
 * Formats a height value to ensure it has "px" suffix
 */
export function formatHeight(value: string): string {
  if (!value) return ""
  const trimmed = value.trim()
  if (trimmed === "") return ""
  
  // If it already ends with px, return as is
  if (trimmed.toLowerCase().endsWith("px")) {
    return trimmed
  }
  
  // Extract number
  const numberMatch = trimmed.match(/^(\d+(\.\d+)?)/)
  if (numberMatch) {
    return `${numberMatch[1]}px`
  }
  
  return trimmed
}

/**
 * Validates if a logo path exists in the logo registry
 */
export function isLogoPathValid(
  path: string,
  logoRegistry: Record<string, any> | undefined
): boolean {
  if (!path || !logoRegistry) return true // Empty is allowed
  
  // Check if path exists in any logo registry entry
  return Object.values(logoRegistry).some(
    (entry: any) => entry.path === path
  )
}

/**
 * Validates hex color format
 */
export function isValidHexColor(value: string): boolean {
  if (!value) return true
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexPattern.test(value)
}

