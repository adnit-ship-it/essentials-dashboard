/**
 * Utilities for handling logo height values
 */

/**
 * Extracts numeric value from a string like "24px" or "24"
 * @param value - The height value string
 * @returns The numeric part as a string, or empty string if invalid
 */
export function extractNumericValue(value: string): string {
  if (!value) return ""
  const match = value.match(/^(\d+(?:\.\d+)?)/)
  return match ? match[1] : value.replace(/px/gi, "").trim()
}

/**
 * Formats a numeric value with "px" suffix
 * @param value - The numeric value (with or without "px")
 * @returns Formatted value with "px" suffix
 */
export function formatWithPx(value: string): string {
  if (!value) return ""
  const numeric = extractNumericValue(value)
  return numeric ? `${numeric}px` : value
}





