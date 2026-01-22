/**
 * Utility functions for formatting component values for display in preview cards
 */

export function formatValueForDisplay(value: any, componentKey: string): string {
  if (value === null || value === undefined) {
    return "—"
  }

  // Handle text fields (heading, subheading, paragraph, etc.)
  if (typeof value === "string") {
    // Truncate long strings
    if (value.length > 50) {
      return value.substring(0, 50) + "..."
    }
    return value
  }

  // Handle objects with text property
  if (typeof value === "object" && !Array.isArray(value)) {
    // Text-like objects (heading, subheading, paragraph)
    if (value.text !== undefined) {
      const text = String(value.text || "")
      if (text.length > 50) {
        return text.substring(0, 50) + "..."
      }
      return text || "—"
    }

    // Color objects
    if (value.color !== undefined) {
      return `Color: ${value.color}`
    }

    // Button objects
    if (value.text !== undefined && (componentKey.includes("button") || componentKey.includes("Button"))) {
      return `Button: ${value.text || "—"}`
    }

    // Logo/media objects
    if (value.src !== undefined || value.path !== undefined) {
      const src = value.src || value.path || ""
      if (src.length > 30) {
        return src.substring(0, 30) + "..."
      }
      return src || "—"
    }

    // Show object keys as summary
    const keys = Object.keys(value)
    if (keys.length > 0) {
      return `${keys.length} properties`
    }

    return "Object"
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "0 items"
    }
    return `${value.length} item${value.length !== 1 ? "s" : ""}`
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  // Handle numbers
  if (typeof value === "number") {
    return String(value)
  }

  // Fallback
  return String(value)
}

/**
 * Gets a color value from a component value for display
 */
export function getColorValue(value: any): string | null {
  if (typeof value === "string") {
    // Check if it's a hex color or color name
    if (value.startsWith("#") || value.match(/^[a-zA-Z]+$/)) {
      return value
    }
  }

  if (typeof value === "object" && value !== null) {
    if (value.color) {
      return value.color
    }
  }

  return null
}

/**
 * Checks if a value represents an array
 */
export function isArrayValue(value: any): boolean {
  return Array.isArray(value)
}

/**
 * Gets the count of items in an array value
 */
export function getArrayCount(value: any): number {
  if (Array.isArray(value)) {
    return value.length
  }
  return 0
}

/**
 * Extract text value from text/button components
 */
export function getTextValue(value: any, componentKey: string): string | null {
  if (typeof value === "string") {
    return value
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    // Check for text property
    if (value.text !== undefined) {
      return String(value.text || "")
    }
  }

  return null
}

/**
 * Extract color value from component (handles nested objects)
 */
export function getColorValueForDisplay(value: any, componentKey: string): string | null {
  if (typeof value === "string") {
    // Check if it's a hex color or brand color name
    if (value.startsWith("#") || /^(bodyColor|accentColor1|accentColor2|backgroundColor)$/.test(value)) {
      return value
    }
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    // Direct color property
    if (value.color) {
      return value.color
    }
    // Nested in button
    if (value.button?.color) {
      return value.button.color
    }
    // Nested in icon
    if (value.icon?.color) {
      return value.icon.color
    }
    // Nested in bulletpointIcon
    if (value.bulletpointIcon?.color) {
      return value.bulletpointIcon.color
    }
  }

  return null
}

/**
 * Extract image source from media/logo components
 */
export function getImageSource(value: any): string | null {
  if (typeof value === "string") {
    return value
  }

  if (typeof value === "object" && value !== null) {
    // Single media/logo object
    if (value.src) {
      return value.src
    }
    if (value.path) {
      return value.path
    }
    // Array - get first item
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0]
      if (typeof first === "object" && first !== null) {
        return first.src || first.path || null
      }
    }
  }

  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (typeof first === "object" && first !== null) {
      return first.src || first.path || null
    }
  }

  return null
}

/**
 * Format array count display text
 */
export function getArrayDisplayText(value: any, componentKey: string): string {
  if (!Array.isArray(value)) {
    return ""
  }

  const count = value.length
  const componentName = componentKey
    .replace(/([A-Z])/g, " $1")
    .replace(/-/g, " ")
    .trim()

  // Handle pluralization
  if (componentKey === "buttons") {
    return `${count} Button${count !== 1 ? "s" : ""}`
  }
  if (componentKey === "bulletPoints") {
    return `${count} Bulletpoint${count !== 1 ? "s" : ""}`
  }
  if (componentKey === "steps") {
    return `${count} Step${count !== 1 ? "s" : ""}`
  }
  if (componentKey === "faq") {
    return `${count} FAQ${count !== 1 ? "s" : ""}`
  }
  if (componentKey === "features") {
    return `${count} Feature${count !== 1 ? "s" : ""}`
  }
  if (componentKey === "reviews") {
    return `${count} Review${count !== 1 ? "s" : ""}`
  }
  if (componentKey === "statistics") {
    return `${count} Statistic${count !== 1 ? "s" : ""}`
  }
  if (componentKey === "before-after") {
    return `${count} Before/After${count !== 1 ? "s" : ""}`
  }
  if (componentKey === "logos") {
    return `${count} Logo${count !== 1 ? "s" : ""}`
  }

  return `${count} ${componentName}${count !== 1 ? "s" : ""}`
}

/**
 * Extract title/text for card components
 */
export function getCardTitle(value: any, componentKey: string): string {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    // Check for title
    if (value.title) {
      return String(value.title)
    }
    // Check for text
    if (value.text) {
      return String(value.text)
    }
    // Check for button text (productCard)
    if (value.button?.text) {
      return String(value.button.text)
    }
    // Check for productId (productCard)
    if (value.productId) {
      return `Product: ${value.productId}`
    }
  }

  // Fallback to component name
  return componentKey.replace(/([A-Z])/g, " $1").replace(/-/g, " ")
}

/**
 * Check if component type displays images
 */
export function isMediaComponent(editorType: string): boolean {
  return editorType === "logo" || editorType === "logos" || editorType === "media"
}

/**
 * Check if component type is generic fallback
 */
export function isGenericComponent(editorType: string): boolean {
  return editorType === "generic"
}
