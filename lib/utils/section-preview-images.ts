
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

/**
 * Gets the preview image path for a logo based on its type and template
 * 
 * @param logoType - The type of logo (e.g., "navbar", "hero", "contact", "products", "loadingScreen")
 * @param templateName - The name of the template (e.g., "Serenova Template")
 * @returns The image path or null if template is not available
 * 
 * @example
 * getLogoPreviewImagePath("navbar", "Serenova Template")
 * // Returns: "/section-screenshots/serenova-template/navbar.png"
 */
export function getLogoPreviewImagePath(
  logoType: "navbar" | "footer" | "loadingScreen" | "hero" | "contact" | "products",
  templateName: string | null
): string | null {
  if (!templateName) return null
  
  const normalizedTemplate = normalizeTemplateName(templateName)
  
  // Map logo types to their corresponding screenshot section names
  const sectionMap: Record<typeof logoType, string> = {
    navbar: "navbar",
    footer: "footer",
    loadingScreen: "loading-screen",
    hero: "home-hero",
    contact: "contact-hero",
    products: "products-hero",
  }
  
  const sectionName = sectionMap[logoType]
  
  return `/section-screenshots/${normalizedTemplate}/${sectionName}.png`
}

/**
 * Maps page keys to their hero section screenshot names
 */
const pageHeroMap: Record<string, string> = {
  home: "home-hero",
  about: "about-hero",
  contact: "contact-hero",
  products: "products-hero",
}

/**
 * Gets the preview image path for a page based on its key and template type
 * Uses the hero section screenshot as the page preview
 * 
 * @param pageKey - The key of the page (e.g., "home", "about", "contact", "products")
 * @param templateName - The name of the template (e.g., "Serenova Template")
 * @returns The image path or null if template is not available
 * 
 * @example
 * getPagePreviewImagePath("about", "Serenova Template")
 * // Returns: "/section-screenshots/serenova-template/about-hero.png"
 */
export function getPagePreviewImagePath(
  pageKey: string,
  templateName: string | null
): string | null {
  if (!templateName) return null
  
  const normalizedTemplate = normalizeTemplateName(templateName)
  const sectionName = pageHeroMap[pageKey.toLowerCase()] || `${pageKey.toLowerCase()}-hero`
  
  return `/section-screenshots/${normalizedTemplate}/${sectionName}.png`
}

