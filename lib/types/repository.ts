/**
 * Repository type definitions for multi-repo support
 */

/**
 * Repository information from GitHub API
 */
export interface GitHubRepo {
  id: string; // Format: "owner/repo"
  owner: string;
  repo: string;
  defaultBranch: string;
  fullName: string;
  description: string | null;
  private: boolean;
}

/**
 * Repository configuration stored per repo
 */
export interface RepoConfig {
  id: string; // Format: "owner/repo"
  owner: string;
  repo: string;
  defaultBranch: string;
  displayName?: string; // User-friendly name (defaults to repo name)
  
  // User-configured file paths
  contentFilePath: string;
  productsFilePath: string;
  tailwindConfigPath: string;
  brandLogoPath: string;
  brandAltLogoPath: string;
  pagesFilePath?: string;
  sectionsFilePath?: string;
  
  // Metadata
  isConfigured: boolean;
  lastAccessed?: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Default file paths for repositories
 */
export const DEFAULT_FILE_PATHS = {
  contentFilePath: "data/websiteText.json",
  productsFilePath: "data/intake-form/products.ts",
  tailwindConfigPath: "tailwind.config.js",
  brandLogoPath: "public/assets/images/brand/logo.svg",
  brandAltLogoPath: "public/assets/images/brand/logo-alt.svg",
  pagesFilePath: "data/pages.json",
  sectionsFilePath: "data/sections.json",
};

/**
 * Path validation result
 */
export interface PathValidationResult {
  path: string;
  exists: boolean;
  error?: string;
  suggestion?: string;
}


