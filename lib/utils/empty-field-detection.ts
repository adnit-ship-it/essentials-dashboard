/**
 * Detects if a component value represents empty/default placeholder content.
 * Used to highlight fields that need user input.
 */

const EMPTY_TEXT_PLACEHOLDERS = new Set([
  "",
  "New Section",
  "Add your content here",
  "Add your message here",
  "Add your content",
  "Learn More",
  "Get Started",
  "Start Today",
  "Explore our offerings",
  "Feature 1",
  "Feature 2",
  "Trusted By",
  "Call to Action",
  "Discover",
  "Our Journey",
  "FAQ",
  "Statistics",
])

function isTextEmpty(val: unknown): boolean {
  if (typeof val !== "string") return false
  const trimmed = val.trim()
  return trimmed === "" || EMPTY_TEXT_PLACEHOLDERS.has(trimmed)
}

function isSrcEmpty(val: unknown): boolean {
  if (typeof val !== "string") return true
  return val.trim() === ""
}

/**
 * Check if a component value has empty/default content that the user should fill in.
 */
export function isComponentValueEmpty(
  value: unknown,
  _componentKey?: string,
  _editorType?: string
): boolean {
  if (value == null) return true
  if (typeof value === "string") return isTextEmpty(value)
  if (Array.isArray(value)) return value.length === 0

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>

    // Check common text fields
    if ("text" in obj && isTextEmpty(obj.text)) return true
    if ("src" in obj && isSrcEmpty(obj.src)) return true

    // Check nested objects (e.g. heading.text, logo.src)
    if (obj.heading && typeof obj.heading === "object") {
      const h = obj.heading as Record<string, unknown>
      if ("text" in h && isTextEmpty(h.text)) return true
    }
    if (obj.subheading && typeof obj.subheading === "object") {
      const s = obj.subheading as Record<string, unknown>
      if ("text" in s && isTextEmpty(s.text)) return true
    }
    if (obj.logo && typeof obj.logo === "object") {
      const l = obj.logo as Record<string, unknown>
      if ("src" in l && isSrcEmpty(l.src)) return true
    }
    if (obj.media && typeof obj.media === "object") {
      const m = obj.media as Record<string, unknown>
      if (m.background && typeof m.background === "object") {
        const bg = m.background as Record<string, unknown>
        if ("src" in bg && isSrcEmpty(bg.src)) return true
      }
      if (m.image && typeof m.image === "object") {
        const img = m.image as Record<string, unknown>
        if ("src" in img && isSrcEmpty(img.src)) return true
      }
    }

    // Check array fields
    if ("items" in obj && Array.isArray(obj.items) && obj.items.length === 0)
      return true
    if ("logos" in obj && Array.isArray(obj.logos) && obj.logos.length === 0)
      return true
    if ("faq" in obj && typeof obj.faq === "object") {
      const faq = obj.faq as { items?: unknown[] }
      if (Array.isArray(faq?.items) && faq.items.length === 0) return true
    }
    if ("features" in obj && Array.isArray(obj.features) && obj.features.length === 0)
      return true
    if ("stats" in obj && Array.isArray(obj.stats) && obj.stats.length === 0)
      return true
  }

  return false
}
