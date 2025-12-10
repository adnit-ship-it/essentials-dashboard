/**
 * Repository configuration service
 * Manages loading and saving repository configurations
 */

import type { RepoConfig, PathValidationResult } from "../types/repository";
import { DEFAULT_FILE_PATHS } from "../types/repository";
import { getAuthenticatedClient } from "../../githubAuth";
import * as fs from "fs";
import * as path from "path";

// File path for persisting repo configs (deprecated: no longer used)
const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "repo-configs.json");

// In-memory storage for backward compatibility only; persistence disabled
const repoConfigs: Map<string, RepoConfig> = new Map();

// Persistence disabled; no-op
function ensureDataDirectory() {}

// Persistence disabled; start with empty in-memory map
function loadConfigsFromFile(): void {
  repoConfigs.clear();
}

// Persistence disabled; no-op
function saveConfigsToFile(): void {}

// Load configs on module initialization
loadConfigsFromFile();

/**
 * Get default file paths
 */
export function getDefaultFilePaths() {
  return { ...DEFAULT_FILE_PATHS };
}

/**
 * Generate a repo config with defaults
 */
export function createDefaultRepoConfig(
  owner: string,
  repo: string,
  defaultBranch: string,
  displayName?: string
): RepoConfig {
  const id = `${owner}/${repo}`;
  const defaults = getDefaultFilePaths();
  const now = new Date().toISOString();

  return {
    id,
    owner,
    repo,
    defaultBranch,
    displayName: displayName || repo,
    ...defaults,
    isConfigured: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Load a repository configuration
 */
export function getRepoConfig(_repoId: string): RepoConfig | null {
  // No persisted configs; always return null so callers use runtime/env or request-provided config
  return null;
}

/**
 * Get all configured repositories
 */
export function getAllRepoConfigs(): RepoConfig[] {
  // No persisted configs
  return [];
}

/**
 * Save a repository configuration
 */
export function saveRepoConfig(_config: RepoConfig): void {
  // Persistence disabled; ignore saves to disk
  console.log("ℹ️ Repository persistence disabled; saveRepoConfig call ignored.");
}

/**
 * Delete a repository configuration
 */
export function deleteRepoConfig(_repoId: string): boolean {
  // Persistence disabled; nothing to delete
  return false;
}

/**
 * Update last accessed time for a repo
 */
export function updateLastAccessed(_repoId: string): void {
  // No-op
}

/**
 * Validate file paths exist in a repository
 */
export async function validateRepoPaths(
  owner: string,
  repo: string,
  branch: string,
  paths: {
    contentFilePath?: string;
    productsFilePath?: string;
    tailwindConfigPath?: string;
    brandLogoPath?: string;
    brandAltLogoPath?: string;
  }
): Promise<PathValidationResult[]> {
  const octokit = await getAuthenticatedClient();
  const results: PathValidationResult[] = [];

  const pathEntries = Object.entries(paths).filter(([_, path]) => path);

  await Promise.all(
    pathEntries.map(async ([key, path]) => {
      try {
        await octokit.repos.getContent({
          owner,
          repo,
          path: path!,
          ref: branch,
        });
        results.push({ path, exists: true });
      } catch (error: any) {
        if (error.status === 404) {
          results.push({
            path,
            exists: false,
            error: "File not found",
          });
        } else {
          results.push({
            path,
            exists: false,
            error: error.message || "Unknown error",
          });
        }
      }
    })
  );

  return results;
}

