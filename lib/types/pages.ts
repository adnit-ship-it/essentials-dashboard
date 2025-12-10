/**
 * Type definitions for Pages.json structure
 */

/**
 * Icon registry entry
 */
export interface IconRegistryEntry {
  type: string;
  path: string;
  description: string;
}

/**
 * Icon registry (top-level in Pages.json)
 */
export type IconRegistry = Record<string, IconRegistryEntry>;

/**
 * Logo registry entry
 */
export interface LogoRegistryEntry {
  type: string;
  path: string;
  description: string;
}

/**
 * Logo registry (top-level in Pages.json)
 */
export type LogoRegistry = Record<string, LogoRegistryEntry>;

/**
 * Page section reference (in Pages.json)
 */
export interface PageSection {
  name: string; // Identifier linking to Sections.json
  component: string | null; // React component name
  props: Record<string, any>; // Page-specific props
  show: boolean;
  order: number;
}

/**
 * Navbar/Footer logo configuration
 */
export interface LayoutLogo {
  src: string;
  alt: string;
  sizes: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

/**
 * Navbar configuration
 */
export interface NavbarConfig {
  heights: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  logo: LayoutLogo;
}

/**
 * Footer configuration
 */
export interface FooterConfig {
  heights: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  logo: LayoutLogo;
}

/**
 * Page definition
 */
export interface Page {
  title: string;
  show: boolean;
  order: number;
  description: string;
  navbar?: NavbarConfig;
  footer?: FooterConfig;
  sections: PageSection[];
}

/**
 * Page key (route identifier)
 */
export type PageKey = string;

/**
 * Pages data structure (Pages.json)
 */
export type PagesData = {
  iconRegistry?: IconRegistry;
  logoRegistry?: LogoRegistry;
} & {
  [key: string]: Page | IconRegistry | LogoRegistry | undefined;
}

/**
 * Helper type guard to check if a key is a page
 */
export function isPageKey(key: string, data: PagesData): key is PageKey {
  return (
    key !== "iconRegistry" &&
    key !== "logoRegistry" &&
    typeof data[key] === "object" &&
    "sections" in data[key]
  );
}

