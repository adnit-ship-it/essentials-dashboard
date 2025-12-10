/**
 * Type definitions for Sections.json structure
 */

/**
 * Component structure (flexible object type)
 * Components can have various keys like "logo", "heading", "button", etc.
 */
export type Component = Record<string, any>;

/**
 * Section definition
 */
export interface Section {
  name: string; // Identifier matching Pages.json section name
  components: Component[]; // Array of component objects
}

/**
 * Sections data structure (Sections.json)
 * This is an array of sections
 */
export type SectionsData = Section[];

/**
 * Helper to find a section by name
 */
export function findSectionByName(
  sections: SectionsData,
  name: string
): Section | undefined {
  return sections.find((section) => section.name === name);
}

/**
 * Component type identifiers (for editor routing)
 */
export type ComponentType =
  | "heading"
  | "subheading"
  | "paragraph"
  | "ctaButton"
  | "button"
  | "button1"
  | "button2"
  | "logo"
  | "media"
  | "bulletPoints"
  | "logos"
  | "steps"
  | "faq"
  | "before-after"
  | "marqueeSpeed"
  | "productCard"
  | "stats"
  | "infoCard"
  | "infoCard with bulletpoint"
  | "product-card-badge"
  | "title-bar";

