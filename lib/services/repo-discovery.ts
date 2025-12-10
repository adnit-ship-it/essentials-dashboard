/**
 * Repository discovery service
 * Fetches repositories available to the GitHub App installation
 */

import { getAuthenticatedClient } from "../../githubAuth";
import type { GitHubRepo } from "../types/repository";

/**
 * Fetches all repositories available to the GitHub App installation
 */
export async function fetchAvailableRepos(): Promise<GitHubRepo[]> {
  try {
    const octokit = await getAuthenticatedClient();
    
    // Fetch repositories from the installation
    const { data } = await octokit.request("GET /installation/repositories");
    
    // Map to our GitHubRepo format
    return data.repositories.map((repo: any) => ({
      id: repo.full_name, // "owner/repo"
      owner: repo.owner.login,
      repo: repo.name,
      defaultBranch: repo.default_branch,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
    }));
  } catch (error) {
    console.error("Error fetching available repositories:", error);
    throw new Error(
      `Failed to fetch repositories: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}


