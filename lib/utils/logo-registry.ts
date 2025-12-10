/**
 * Utilities for logo registry management
 */

import type { LogoRegistry, PagesData, PageKey } from "@/lib/types/pages"
import type { SectionsData } from "@/lib/types/sections"
import { isPageKey } from "@/lib/types/pages"

/**
 * Generate next available logo key (logo3, logo4, etc.)
 */
export function generateNextLogoKey(logoRegistry: LogoRegistry): string {
  const keys = Object.keys(logoRegistry)
  const logoKeys = keys.filter((key) => key.startsWith("logo") && /^logo\d+$/.test(key))
  
  if (logoKeys.length === 0) {
    return "logo3" // primary and secondary are logo1 and logo2 conceptually
  }
  
  const numbers = logoKeys
    .map((key) => {
      const match = key.match(/^logo(\d+)$/)
      return match ? parseInt(match[1], 10) : 0
    })
    .filter((n) => n > 0)
  
  const maxNumber = Math.max(...numbers, 2) // Start from 3 if no numbered logos
  return `logo${maxNumber + 1}`
}

/**
 * Generate unique logo filename with timestamp
 * Pattern: logo-{timestamp}.{ext}
 */
export function generateLogoFileName(file: File): string {
  const timestamp = Date.now()
  const extension = file.name.split('.').pop()?.toLowerCase() || 'svg'
  return `logo-${timestamp}.${extension}`
}

/**
 * Build reference map for logo paths
 * Returns: { logoPath: [usageLocations] }
 */
export function buildLogoReferenceMap(
  pagesData: PagesData,
  sectionsData: SectionsData
): Record<string, string[]> {
  const references: Record<string, string[]> = {}
  
  // Helper to add reference
  const addReference = (path: string, location: string) => {
    if (!path) return
    if (!references[path]) {
      references[path] = []
    }
    if (!references[path].includes(location)) {
      references[path].push(location)
    }
  }
  
  // Scan pages for navbar/footer logos
  const pageKeys = Object.keys(pagesData).filter((key) => isPageKey(key, pagesData))
  for (const pageKey of pageKeys) {
    const page = pagesData[pageKey] as any
    if (page.navbar?.logo?.src) {
      addReference(page.navbar.logo.src, `${page.title} navbar`)
    }
    if (page.footer?.logo?.src) {
      addReference(page.footer.logo.src, `${page.title} footer`)
    }
  }
  
  // Scan sections for logo components
  for (const section of sectionsData) {
    for (const component of section.components) {
      if (component.logo?.src) {
        addReference(component.logo.src, `${section.name} section`)
      }
    }
  }
  
  return references
}

/**
 * Check if logo is in use
 */
export function isLogoInUse(
  logoPath: string,
  pagesData: PagesData,
  sectionsData: SectionsData
): { inUse: boolean; locations: string[] } {
  const referenceMap = buildLogoReferenceMap(pagesData, sectionsData)
  const locations = referenceMap[logoPath] || []
  return {
    inUse: locations.length > 0,
    locations,
  }
}

