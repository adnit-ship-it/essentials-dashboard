/**
 * Utility functions for section preview image path resolution
 */

/**
 * Normalizes a template name to kebab-case for use in file paths
 * Always appends "-template" to ensure it matches the folder structure
 * Example: "Serenova Template" -> "serenova-template"
 * Example: "Serenova" -> "serenova-template"
 */
function normalizeTemplateName(templateName: string): string {
  const normalized = templateName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  
  // Ensure "-template" suffix exists (handle both "serenova-template" and "serenova")
  return normalized.endsWith('-template') ? normalized : `${normalized}-template`
}

/**
 * Normalizes a section name to kebab-case for use in file paths
 * Example: "Home Hero" -> "home-hero"
 */
function normalizeSectionName(sectionName: string): string {
  return sectionName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Gets the preview image path for a section based on its name and template type
 * 
 * @param sectionName - The name of the section (e.g., "Home Hero")
 * @param templateName - The name of the template (e.g., "Serenova Template")
 * @returns The image path or null if template is not available
 * 
 * @example
 * getSectionPreviewImagePath("Home Hero", "Serenova Template")
 * // Returns: "/section-screenshots/serenova-template/home-hero.png"
 */
export function getSectionPreviewImagePath(
  sectionName: string,
  templateName: string | null
): string | null {
  if (!templateName) return null
  
  const normalizedTemplate = normalizeTemplateName(templateName)
  const normalizedSection = normalizeSectionName(sectionName)
  
  return `/section-screenshots/${normalizedTemplate}/${normalizedSection}.png`
}

