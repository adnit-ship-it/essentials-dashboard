/**
 * Type definitions for Legal Pages (data/legal.json)
 */

/**
 * SEO metadata for a legal page
 */
export interface LegalPageSeo {
  title?: string;
  description?: string;
}

/**
 * A single legal page (Privacy Policy, Terms, etc.)
 */
export interface LegalPage {
  id: string;
  slug: string;
  title: string;
  footerLabel: string;
  lastUpdated: string;
  showInFooter: boolean;
  order: number;
  seo?: LegalPageSeo;
  content: string; // HTML content from rich text editor
}

/**
 * Legal data structure (data/legal.json)
 */
export interface LegalData {
  pages: LegalPage[];
}

/**
 * Helper to find a legal page by id
 */
export function findLegalPageById(
  data: LegalData,
  id: string
): LegalPage | undefined {
  return data.pages.find((page) => page.id === id);
}

/**
 * Helper to find a legal page by slug
 */
export function findLegalPageBySlug(
  data: LegalData,
  slug: string
): LegalPage | undefined {
  return data.pages.find((page) => page.slug === slug);
}

/**
 * Get legal pages sorted by order
 */
export function getSortedLegalPages(data: LegalData): LegalPage[] {
  return [...data.pages].sort((a, b) => a.order - b.order);
}

/**
 * Get legal pages that should appear in footer
 */
export function getFooterLegalPages(data: LegalData): LegalPage[] {
  return getSortedLegalPages(data).filter((page) => page.showInFooter);
}

/**
 * Generate a unique ID for a new legal page
 */
export function generateLegalPageId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate a slug from title
 */
export function generateLegalPageSlug(title: string): string {
  return generateLegalPageId(title);
}

/**
 * Create a new legal page with defaults
 */
export function createLegalPage(
  title: string,
  existingPages: LegalPage[]
): LegalPage {
  const id = generateLegalPageId(title);
  const slug = generateLegalPageSlug(title);
  const maxOrder = existingPages.reduce((max, p) => Math.max(max, p.order), 0);

  return {
    id,
    slug,
    title,
    footerLabel: title,
    lastUpdated: new Date().toISOString().split("T")[0],
    showInFooter: true,
    order: maxOrder + 1,
    content: "",
  };
}
