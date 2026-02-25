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
 * Announcement bar configuration
 */
export interface AnnouncementConfig {
  enabled: boolean;
  text: string;
  link?: string;
  backgroundColor: string;
  textColor: string;
  heights: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

/**
 * Default announcement config
 */
export const DEFAULT_ANNOUNCEMENT_CONFIG: AnnouncementConfig = {
  enabled: false,
  text: "",
  link: "",
  backgroundColor: "#750021",
  textColor: "#ffffff",
  heights: {
    mobile: "60px",
    tablet: "70px",
    desktop: "80px",
  },
};

/**
 * Page definition (pages.json - page keys only)
 */
export interface Page {
  title: string;
  show: boolean;
  order: number;
  description: string;
  sections: PageSection[];
  [key: string]: any; // Allow page-specific fields (pageTitle, form, logo, etc.)
}

/**
 * Page key (route identifier)
 */
export type PageKey = string;

/**
 * Pages data structure (Pages.json)
 * Contains only page definitions - iconRegistry, logoRegistry, announcement, navbar moved to media.json and common.json
 */
export type PagesData = Record<string, Page>;

/**
 * Helper type guard to check if a key is a page
 */
export function isPageKey(key: string, data: PagesData): key is PageKey {
  const value = data[key];
  return (
    typeof value === "object" &&
    value !== null &&
    "sections" in value &&
    Array.isArray((value as Page).sections)
  );
}

