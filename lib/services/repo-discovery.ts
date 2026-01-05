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
    
    // Fetch all repositories from the installation (with pagination)
    let allRepos: any[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const { data: repos } = await octokit.request("GET /installation/repositories", {
        per_page: 100, // Max items per page
        page: page,
      });
      
      if (repos.repositories && repos.repositories.length > 0) {
        allRepos = allRepos.concat(repos.repositories);
        // Check if there are more pages (if we got less than 100, we're done)
        hasMore = repos.repositories.length === 100;
        page++;
      } else {
        hasMore = false;
      }
    }
    
    // Map to our GitHubRepo format
    return allRepos.map((repo: any) => ({
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


