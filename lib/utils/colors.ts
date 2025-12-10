/**
 * Color validation and normalization utilities
 */

/**
 * Validates if a string is a valid hex color
 * @param value - The color value to validate
 * @returns True if valid hex color format (#RRGGBB)
 */
export function isValidHex(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim())
}

/**
 * Normalizes a hex color value for saving
 * @param value - The color value to normalize
 * @returns Normalized hex color in uppercase (e.g., "#FF0000")
 * @throws Error if value is not a valid hex color
 */
export function normalizeHexForSave(value: string): string {
  const trimmed = value.trim()
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
  if (!isValidHex(withHash)) {
    throw new Error(
      `${value} is not a valid hex color. Use the format #RRGGBB (6 digits).`
    )
  }
  return withHash.toUpperCase()
}





