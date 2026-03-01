/**
 * Maps React component names to section registry IDs.
 * Used for auto-recovery when a section exists in pages.json but not in sections.json.
 */

import { FALLBACK_SECTION_TYPES } from "./section-defaults"
import type { SectionsRegistry } from "@/lib/types/sections-registry"

const FALLBACK_COMPONENT_TO_ID: Record<string, string> = Object.fromEntries(
  FALLBACK_SECTION_TYPES.map((entry) => [entry.component, entry.id])
)

/**
 * Get registry ID for a component name (e.g. HeroSection -> hero).
 * Uses sectionsRegistryData when available, otherwise fallback mapping.
 */
export function getRegistryIdForComponent(
  component: string,
  sectionsRegistry?: SectionsRegistry | null
): string | null {
  if (sectionsRegistry?.sections) {
    const entry = sectionsRegistry.sections.find(
      (s) => s.component === component
    )
    if (entry) return entry.id
  }
  return FALLBACK_COMPONENT_TO_ID[component] ?? null
}
