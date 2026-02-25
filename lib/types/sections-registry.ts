/**
 * Type definitions for sections-registry.json structure
 */

export interface SectionRegistryEntry {
  id: string;
  name: string;
  component: string;
  description: string;
}

export interface SectionsRegistry {
  sections: SectionRegistryEntry[];
}
