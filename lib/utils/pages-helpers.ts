/**
 * Helper functions for pages and sections management
 */

import type { PagesData, Page, PageKey, PageSection } from "@/lib/types/pages"
import type { SectionsData, Section } from "@/lib/types/sections"
import { isPageKey } from "@/lib/types/pages"
import { findSectionByName } from "@/lib/types/sections"

/**
 * Get all page keys from PagesData (excluding iconRegistry)
 */
export function getPageKeys(pagesData: PagesData): PageKey[] {
  return Object.keys(pagesData).filter((key) => isPageKey(key, pagesData))
}

/**
 * Get all pages as an array, sorted by order
 */
export function getPagesArray(pagesData: PagesData): Array<{ key: PageKey; page: Page }> {
  const pageKeys = getPageKeys(pagesData)
  return pageKeys
    .map((key) => ({
      key,
      page: pagesData[key] as Page,
    }))
    .sort((a, b) => a.page.order - b.page.order)
}

/**
 * Get sections for a specific page
 */
export function getSectionsForPage(
  pagesData: PagesData,
  pageKey: PageKey
): PageSection[] {
  const page = pagesData[pageKey] as Page | undefined
  if (!page) return []
  return [...page.sections].sort((a, b) => a.order - b.order)
}

/**
 * Find a section by name in Sections.json
 */
export function findSectionInSections(
  sectionsData: SectionsData,
  name: string
): Section | undefined {
  return findSectionByName(sectionsData, name)
}

/**
 * Reorder pages by updating their order values
 */
export function reorderPages(
  pagesData: PagesData,
  newOrder: PageKey[]
): PagesData {
  const updated = { ...pagesData }
  newOrder.forEach((pageKey, index) => {
    const page = updated[pageKey] as Page | undefined
    if (page) {
      updated[pageKey] = {
        ...page,
        order: index + 1,
      } as Page
    }
  })
  return updated
}

/**
 * Reorder sections within a page
 */
export function reorderSections(
  pagesData: PagesData,
  pageKey: PageKey,
  newOrder: string[] // Array of section names
): PagesData {
  const updated = { ...pagesData }
  const page = updated[pageKey] as Page | undefined
  if (!page) return updated

  const sectionsMap = new Map(page.sections.map((s) => [s.name, s]))
  const reorderedSections: PageSection[] = newOrder.map((name, index) => {
    const section = sectionsMap.get(name)
    if (!section) {
      throw new Error(`Section "${name}" not found in page "${pageKey}"`)
    }
    return {
      ...section,
      order: index + 1,
    }
  })

  updated[pageKey] = {
    ...page,
    sections: reorderedSections,
  } as Page

  return updated
}

/**
 * Update a page's properties
 */
export function updatePage(
  pagesData: PagesData,
  pageKey: PageKey,
  updates: Partial<Page>
): PagesData {
  const updated = { ...pagesData }
  const page = updated[pageKey] as Page | undefined
  if (!page) return updated

  updated[pageKey] = {
    ...page,
    ...updates,
  } as Page

  return updated
}

/**
 * Update a section's properties within a page
 */
export function updatePageSection(
  pagesData: PagesData,
  pageKey: PageKey,
  sectionName: string,
  updates: Partial<PageSection>
): PagesData {
  const updated = { ...pagesData }
  const page = updated[pageKey] as Page | undefined
  if (!page) return updated

  const sections = page.sections.map((section) =>
    section.name === sectionName ? { ...section, ...updates } : section
  )

  updated[pageKey] = {
    ...page,
    sections,
  } as Page

  return updated
}

/**
 * Update a component within a section in Sections.json
 */
export function updateSectionComponent(
  sectionsData: SectionsData,
  sectionName: string,
  componentIndex: number,
  componentKey: string,
  value: any
): SectionsData {
  const updated = [...sectionsData]
  const sectionIndex = updated.findIndex((s) => s.name === sectionName)
  if (sectionIndex === -1) {
    throw new Error(`Section "${sectionName}" not found`)
  }

  const section = { ...updated[sectionIndex] }
  const components = [...section.components]
  
  if (componentIndex >= components.length) {
    throw new Error(`Component index ${componentIndex} out of bounds`)
  }

  const component = { ...components[componentIndex] }
  component[componentKey] = value
  components[componentIndex] = component

  section.components = components
  updated[sectionIndex] = section

  return updated
}

/**
 * Update nested property in a component (e.g., logo.src, heading.text)
 */
export function updateComponentNestedProperty(
  sectionsData: SectionsData,
  sectionName: string,
  componentIndex: number,
  path: string[], // e.g., ["logo", "src"] or ["media", "background", "src"]
  value: any
): SectionsData {
  const updated = [...sectionsData]
  const sectionIndex = updated.findIndex((s) => s.name === sectionName)
  if (sectionIndex === -1) {
    throw new Error(`Section "${sectionName}" not found`)
  }

  const section = { ...updated[sectionIndex] }
  const components = [...section.components]
  
  if (componentIndex >= components.length) {
    throw new Error(`Component index ${componentIndex} out of bounds`)
  }

  const component = { ...components[componentIndex] }
  
  // Navigate to nested property, creating new object references at each level
  // This ensures the JSON comparison in the store detects the change
  let current: any = component
  
  // Build new nested structure
  const newComponent: any = { ...component }
  let newCurrent: any = newComponent
  
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    if (!(key in current)) {
      newCurrent[key] = {}
    } else {
      // Create new object/array reference to ensure change detection
      newCurrent[key] = Array.isArray(current[key]) 
        ? [...current[key]] 
        : typeof current[key] === 'object' && current[key] !== null
        ? { ...current[key] }
        : current[key]
    }
    current = current[key]
    newCurrent = newCurrent[key]
  }
  
  // Set the final value
  newCurrent[path[path.length - 1]] = value
  
  components[componentIndex] = newComponent
  section.components = components
  updated[sectionIndex] = section

  return updated
}

/**
 * Add item to an array property in a component (e.g., bulletPoints.items, logos)
 */
export function addArrayItem(
  sectionsData: SectionsData,
  sectionName: string,
  componentIndex: number,
  arrayKey: string, // e.g., "items" for bulletPoints.items
  item: any
): SectionsData {
  const updated = [...sectionsData]
  const sectionIndex = updated.findIndex((s) => s.name === sectionName)
  if (sectionIndex === -1) {
    throw new Error(`Section "${sectionName}" not found`)
  }

  const section = { ...updated[sectionIndex] }
  const components = [...section.components]
  
  if (componentIndex >= components.length) {
    throw new Error(`Component index ${componentIndex} out of bounds`)
  }

  const component = { ...components[componentIndex] }
  const currentArray = Array.isArray(component[arrayKey]) ? [...component[arrayKey]] : []
  component[arrayKey] = [...currentArray, item]
  
  components[componentIndex] = component
  section.components = components
  updated[sectionIndex] = section

  return updated
}

/**
 * Remove item from an array property in a component
 */
export function removeArrayItem(
  sectionsData: SectionsData,
  sectionName: string,
  componentIndex: number,
  arrayKey: string,
  itemIndex: number
): SectionsData {
  const updated = [...sectionsData]
  const sectionIndex = updated.findIndex((s) => s.name === sectionName)
  if (sectionIndex === -1) {
    throw new Error(`Section "${sectionName}" not found`)
  }

  const section = { ...updated[sectionIndex] }
  const components = [...section.components]
  
  if (componentIndex >= components.length) {
    throw new Error(`Component index ${componentIndex} out of bounds`)
  }

  const component = { ...components[componentIndex] }
  const currentArray = Array.isArray(component[arrayKey]) ? [...component[arrayKey]] : []
  if (itemIndex < 0 || itemIndex >= currentArray.length) {
    throw new Error(`Item index ${itemIndex} out of bounds`)
  }
  
  component[arrayKey] = currentArray.filter((_, i) => i !== itemIndex)
  
  components[componentIndex] = component
  section.components = components
  updated[sectionIndex] = section

  return updated
}

