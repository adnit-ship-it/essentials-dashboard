/**
 * Format component key to human-readable name for Edit button
 * Matches the pattern used in component-preview-card.tsx
 */
export function formatComponentNameForEdit(componentKey: string): string {
  return componentKey
    .replace(/([A-Z])/g, " $1")
    .replace(/-/g, " ")
    .trim()
}
