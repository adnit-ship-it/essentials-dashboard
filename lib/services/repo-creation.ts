import { getAuthenticatedClient } from "../../githubAuth";
import type { TemplateRepo } from "./template-repos";
import type { GitHubFileResponse } from "../../githubAuth";

const DEFAULT_REPO_ORG = "adnit-ship-it";

/**
 * Create a new repository from a template
 */
export async function createRepoFromTemplate(
  templateRepo: TemplateRepo,
  newRepoName: string,
  description?: string,
  isPrivate: boolean = false
): Promise<{ owner: string; repo: string }> {
  const octokit = await getAuthenticatedClient();

  // Validate template repository is accessible
  try {
    await octokit.repos.get({
      owner: templateRepo.owner,
      repo: templateRepo.repo,
    });
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(
        `Template repository not found or not accessible: ${templateRepo.owner}/${templateRepo.repo}`
      );
    }
    throw new Error(
      `Failed to validate template repository: ${error.message}`
    );
  }

  // Create repository name with "store-" prefix
  const finalRepoName = newRepoName.startsWith("store-")
    ? newRepoName
    : `store-${newRepoName}`;

  // Create repository using GitHub's template API
  // This automatically copies all files from the template repository
  let createdRepo;
  try {
    const createResponse = await octokit.repos.createUsingTemplate({
      template_owner: templateRepo.owner,
      template_repo: templateRepo.repo,
      name: finalRepoName,
      owner: DEFAULT_REPO_ORG,
      description: description || `Repository created from template ${templateRepo.name}`,
      private: isPrivate,
    });
    createdRepo = createResponse.data;
  } catch (error: any) {
    if (error.status === 404) {
      // Template repository not found or not accessible
      throw new Error(
        `Template repository "${templateRepo.owner}/${templateRepo.repo}" not found or not accessible. ` +
        `Please ensure: 1) The template repository exists and is marked as a template, ` +
        `2) The GitHub App has access to the template repository, ` +
        `3) The repository names are correct. ` +
        `Error details: ${error.message}`
      );
    }
    if (error.status === 422) {
      // Repository name already exists or invalid name
      throw new Error(
        `Repository name "${finalRepoName}" already exists in account "${DEFAULT_REPO_ORG}" or is invalid.`
      );
    }
    if (error.status === 403) {
      // Permission denied
      throw new Error(
        `Permission denied: GitHub App doesn't have permission to create repositories from templates. ` +
        `Please ensure the App has access to the template repository and repository creation permissions.`
      );
    }
    // Log full error for debugging
    console.error(`[RepoCreation] Full error:`, error);
    throw new Error(
      `Failed to create repository from template: ${error.message || JSON.stringify(error)}`
    );
  }

  // Get default branch (usually "main")
  const defaultBranch = createdRepo.default_branch || "main";
  
  // Verify the repo was created under the correct owner
  const actualOwner = createdRepo.owner?.login || DEFAULT_REPO_ORG;
  if (actualOwner !== DEFAULT_REPO_ORG) {
    console.warn(`[RepoCreation] Repository created under ${actualOwner} instead of ${DEFAULT_REPO_ORG}`);
  }

  // Files are automatically copied by GitHub's template API, so no manual copying needed
  console.log(`[RepoCreation] Repository "${actualOwner}/${finalRepoName}" created successfully from template "${templateRepo.owner}/${templateRepo.repo}"`);

  // Use the actual owner from the created repo (should match DEFAULT_REPO_ORG, but use actual value)
  return {
    owner: actualOwner,
    repo: finalRepoName,
  };
}

/**
 * Updates the hostTemplate.json file with the Vercel deployment URL
 * Reads the existing file, updates only the hostedAt field, and commits it back
 */
export async function updateHostTemplate(
  octokit: Awaited<ReturnType<typeof getAuthenticatedClient>>,
  owner: string,
  repo: string,
  branch: string,
  deploymentUrl: string
): Promise<void> {
  const filePath = "data/hostTemplate.json";
  
  try {
    // Read the existing hostTemplate.json file
    const { data: fileData } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });

    const fileResponse = fileData as GitHubFileResponse;

    if (!fileResponse.content || fileResponse.type !== "file") {
      console.warn(`[HostTemplate] File ${filePath} not found or is not a file, skipping update`);
      return;
    }

    // Decode the base64 content
    const contentString = Buffer.from(fileResponse.content, "base64").toString("utf8");
    const hostTemplate = JSON.parse(contentString);

    // Update only the hostedAt field
    hostTemplate.hostedAt = deploymentUrl;

    // Encode back to base64
    const updatedContent = JSON.stringify(hostTemplate, null, 2);
    const contentBase64 = Buffer.from(updatedContent, "utf8").toString("base64");

    // Commit the updated file
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: "Update hostTemplate.json with Vercel deployment URL",
      content: contentBase64,
      sha: fileResponse.sha,
      branch: branch,
    });

    console.log(`[HostTemplate] Successfully updated ${filePath} with deployment URL: ${deploymentUrl}`);
  } catch (error: any) {
    // If file doesn't exist (404), log warning but don't fail
    if (error.status === 404) {
      console.warn(`[HostTemplate] File ${filePath} not found in repository, skipping update`);
      return;
    }
    // Log error but don't fail the entire operation
    console.error(`[HostTemplate] Failed to update ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Links a GitHub repository to Vercel and creates a project
 * @param repoName - The name of the repository (e.g., "store-my-app")
 * @returns The deployment URL (e.g., "https://store-my-app.vercel.app")
 */
export async function linkToVercel(repoName: string): Promise<string> {
  const vercelToken = process.env.VERCEL_TOKEN;
  
  if (!vercelToken) {
    throw new Error("VERCEL_TOKEN environment variable is not set. Please add it to your .env.local file.");
  }

  try {
    const requestBody = {
      name: repoName,
      framework: "nuxtjs",
      gitRepository: {
        type: "github",
        repo: `${DEFAULT_REPO_ORG}/${repoName}`,
      },
    };

    console.log(`[Vercel] Creating project for ${repoName}...`);
    console.log(`[Vercel] Request body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://api.vercel.com/v9/projects", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    console.log(`[Vercel] Response status: ${response.status} ${response.statusText}`);
    console.log(`[Vercel] Response body:`, JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      throw new Error(
        `Failed to create Vercel project: ${response.status} ${response.statusText}. ${JSON.stringify(responseData)}`
      );
    }

    // Use the actual project name from Vercel's response (normalized, e.g., underscores removed)
    // Vercel normalizes project names, so 'store-dr_drip' becomes 'store-drdrip'
    const actualProjectName = responseData.name || repoName;
    const deploymentUrl = `https://${actualProjectName}.vercel.app`;
    console.log(`[Vercel] Project created with name: ${actualProjectName} (normalized from ${repoName})`);
    console.log(`[Vercel] Project created successfully. Deployment URL: ${deploymentUrl}`);
    
    return deploymentUrl;
  } catch (error: any) {
    // If it's already our error, re-throw it
    if (error.message?.includes("Failed to create Vercel project") || error.message?.includes("VERCEL_TOKEN")) {
      console.error(`[Vercel] Error:`, error.message);
      throw error;
    }
    // Otherwise wrap it
    console.error(`[Vercel] Unexpected error:`, error);
    throw new Error(`Failed to link repository to Vercel: ${error.message || "Unknown error"}`);
  }
}
