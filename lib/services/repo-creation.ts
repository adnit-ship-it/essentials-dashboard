/**
 * Repository creation service
 * Creates new repositories from template repositories
 */

import { getAuthenticatedClient } from "../../githubAuth";
import type { TemplateRepo } from "./template-repos";

// Default organization where all new repositories will be created
const DEFAULT_ORG = "adnit-ship-it";

export interface CreateRepoResult {
  owner: string;
  repo: string;
  fullName: string;
  deploymentUrl: string;
}

/**
 * Updates the hostTemplate.json file with the Vercel deployment URL
 * Reads the existing file, updates only the hostedAt field, and commits it back
 * @param octokit - Authenticated GitHub client
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param deploymentUrl - Vercel deployment URL
 */
async function updateHostTemplate(
  octokit: any,
  owner: string,
  repo: string,
  deploymentUrl: string
): Promise<void> {
  const filePath = "data/hostTemplate.json";
  
  try {
    // Read the existing hostTemplate.json file
    const { data: fileData } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: "main",
    });

    if (!fileData.content || fileData.type !== "file") {
      console.warn(`[HostTemplate] File ${filePath} not found or is not a file, skipping update`);
      return;
    }

    // Decode the base64 content
    const contentString = Buffer.from(fileData.content, "base64").toString("utf8");
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
      sha: fileData.sha,
      branch: "main",
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
  }
}

/**
 * Links a GitHub repository to Vercel and creates a project
 * @param repoName - The name of the repository (e.g., "store-my-app")
 * @returns The deployment URL (e.g., "https://store-my-app.vercel.app")
 */
async function linkToVercel(repoName: string): Promise<string> {
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
        repo: `${DEFAULT_ORG}/${repoName}`,
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

/**
 * Creates a new repository from a template repository
 * Copies all files from the template to the new repository
 * All repositories are created under the adnit-ship-it account (supports both personal accounts and organizations)
 */
export async function createRepoFromTemplate(
  templateRepo: TemplateRepo,
  newRepoName: string,
  description?: string,
  isPrivate: boolean = false
): Promise<CreateRepoResult> {
  const octokit = await getAuthenticatedClient();

  // Add "store-" prefix if not already present
  const prefixedName = newRepoName.startsWith("store-") 
    ? newRepoName 
    : `store-${newRepoName}`;

  // 1. Validate template repo exists and is accessible
  try {
    await octokit.repos.get({
      owner: templateRepo.owner,
      repo: templateRepo.repo,
    });
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(`Template repository "${templateRepo.id}" not found or not accessible`);
    }
    throw new Error(`Failed to access template repository: ${error.message || "Unknown error"}`);
  }

  // 2. Verify installation is on the correct account
  let installationAccount: { login: string; type: string } | null = null;
  try {
    const { App } = await import("@octokit/app");
    const APP_ID = process.env.GITHUB_APP_CLIENT_ID;
    const PRIVATE_KEY_RAW = process.env.GITHUB_PRIVATE_KEY;
    const INSTALLATION_ID = process.env.GITHUB_INSTALLATION_ID;
    
    if (APP_ID && PRIVATE_KEY_RAW && INSTALLATION_ID) {
      const PRIVATE_KEY = PRIVATE_KEY_RAW.replace(/\\n/g, '\n');
      const app = new App({
        appId: APP_ID,
        privateKey: PRIVATE_KEY,
      });
      
      const { data: installation } = await app.octokit.request(
        `GET /app/installations/${INSTALLATION_ID}`,
        {
          headers: {
            accept: "application/vnd.github.v3+json",
          },
        }
      );
      
      installationAccount = {
        login: installation.account?.login || "",
        type: installation.account?.type || "",
      };
      
      // Verify installation is on the correct account
      if (installationAccount.login !== DEFAULT_ORG) {
        throw new Error(
          `GitHub App installation is on "${installationAccount.login}" (${installationAccount.type}), ` +
          `but repositories must be created under "${DEFAULT_ORG}". ` +
          `Please install the app on "${DEFAULT_ORG}" or update DEFAULT_ORG in the code.`
        );
      }
    }
  } catch (error: any) {
    if (error.message?.includes("GitHub App installation is on")) {
      throw error;
    }
    // Continue if we can't verify - the API call will fail with a clear error if there's an issue
  }

  // 3. Check if repository already exists (using prefixed name)
  try {
    await octokit.repos.get({
      owner: DEFAULT_ORG,
      repo: prefixedName,
    });
    // If we get here, repo exists
    throw new Error(
      `Repository "${prefixedName}" already exists in the ${DEFAULT_ORG} account. Please choose a different name.`
    );
  } catch (error: any) {
    if (error.status === 404) {
      // Repo doesn't exist, proceed with creation
    } else if (error.message?.includes("already exists")) {
      throw error;
    }
    // Some other error - continue anyway, API will handle it
  }

  // 4. Create the new repository using template endpoint
  // The template endpoint works for both personal accounts and organizations
  // It automatically copies all files from the template
  let newRepo;
  try {
    const { data } = await octokit.request("POST /repos/{template_owner}/{template_repo}/generate", {
      template_owner: templateRepo.owner,
      template_repo: templateRepo.repo,
      owner: DEFAULT_ORG,
      name: prefixedName,
      description: description || `Created from template ${templateRepo.name}`,
      private: isPrivate,
    });
    newRepo = data;
    
    // Verify the repo was created under the correct account
    if (newRepo.owner.login !== DEFAULT_ORG) {
      throw new Error(
        `Repository was created under "${newRepo.owner.login}" instead of "${DEFAULT_ORG}". ` +
        `Please verify your GitHub App installation is on the correct account.`
      );
    }
  } catch (error: any) {
    if (error.status === 403) {
      const githubMessage = error.response?.data?.message || error.message;
      throw new Error(
        `GitHub App installation does not have permission to create repositories. ` +
        `Error: ${githubMessage}. ` +
        `Please go to https://github.com/settings/apps, select your app, click "Install App", ` +
        `then "Configure" on your installation, and ensure "Administration: Read and write" permission is granted.`
      );
    }
    if (error.status === 404) {
      const githubMessage = error.response?.data?.message || error.message;
      throw new Error(
        `Template repository "${templateRepo.id}" not found or account "${DEFAULT_ORG}" not accessible. ` +
        `Error: ${githubMessage}. ` +
        `Please verify the template repository exists and the GitHub App is installed on "${DEFAULT_ORG}".`
      );
    }
    if (error.status === 422) {
      const githubMessage = error.response?.data?.message || error.message;
      if (githubMessage?.includes("already exists") || error.message?.includes("already exists")) {
        throw new Error(
          `Repository "${prefixedName}" already exists in the ${DEFAULT_ORG} account. Please choose a different name.`
        );
      }
      throw new Error(`Failed to create repository: ${githubMessage || error.message}`);
    }
    throw new Error(
      `Failed to create repository from template: ${error.message || "Unknown error"}`
    );
  }

  // 5. Link repository to Vercel and create project
  let deploymentUrl: string;
  console.log(`[Vercel] Starting Vercel project creation for repository: ${newRepo.name}`);
  console.log(`[Vercel] VERCEL_TOKEN exists: ${!!process.env.VERCEL_TOKEN}`);
  try {
    deploymentUrl = await linkToVercel(newRepo.name);
  } catch (error: any) {
    // Log the error but don't fail the entire operation
    // The repository was created successfully, Vercel linking can be done manually if needed
    console.error(`[Vercel] Failed to link repository to Vercel:`, error);
    console.error(`[Vercel] Error details:`, {
      message: error.message,
      stack: error.stack,
    });
    // Use a placeholder URL - the actual deployment will happen when manually linked
    deploymentUrl = `https://${newRepo.name}.vercel.app`;
  }

  // 6. Update hostTemplate.json with deployment URL (first commit to trigger deployment)
  try {
    await updateHostTemplate(octokit, newRepo.owner.login, newRepo.name, deploymentUrl);
  } catch (error: any) {
    // Log error but don't fail - the repo and Vercel project are already created
    console.error(`[HostTemplate] Failed to update hostTemplate.json:`, error.message);
  }

  return {
    owner: newRepo.owner.login,
    repo: newRepo.name,
    fullName: newRepo.full_name || `${newRepo.owner.login}/${newRepo.name}`,
    deploymentUrl,
  };
}

/**
 * Recursively copies all files from source repository to target repository
 */
async function copyRepoContents(
  octokit: any,
  sourceOwner: string,
  sourceRepo: string,
  targetOwner: string,
  targetRepo: string,
  sourcePath: string = "",
  targetPath: string = "",
  sourceBranch: string = "main"
): Promise<void> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: sourceOwner,
      repo: sourceRepo,
      path: sourcePath || "",
      ref: sourceBranch,
    });

    if (Array.isArray(data)) {
      // Directory - process each item with rate limiting
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const newSourcePath = sourcePath ? `${sourcePath}/${item.name}` : item.name;
        const newTargetPath = targetPath ? `${targetPath}/${item.name}` : item.name;

        if (item.type === "file") {
          await copyFile(octokit, sourceOwner, sourceRepo, targetOwner, targetRepo, newSourcePath, newTargetPath, sourceBranch);
          // Add small delay to avoid rate limiting (every 10 files)
          if ((i + 1) % 10 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } else if (item.type === "dir") {
          await copyRepoContents(
            octokit,
            sourceOwner,
            sourceRepo,
            targetOwner,
            targetRepo,
            newSourcePath,
            newTargetPath,
            sourceBranch
          );
        }
      }
    } else if (data.type === "file") {
      // Single file
      await copyFile(octokit, sourceOwner, sourceRepo, targetOwner, targetRepo, sourcePath, targetPath, sourceBranch);
    }
  } catch (error: any) {
    // Skip files that can't be read (like .git, node_modules, etc.)
    if (error.status === 404) {
      console.warn(`Skipping ${sourcePath}: not found`);
      return;
    }
    throw error;
  }
}

/**
 * Copies a single file from source to target repository
 */
async function copyFile(
  octokit: any,
  sourceOwner: string,
  sourceRepo: string,
  targetOwner: string,
  targetRepo: string,
  sourcePath: string,
  targetPath: string,
  sourceBranch: string = "main"
): Promise<void> {
  try {
    // Skip certain files/directories that shouldn't be copied
    const skipPatterns = [
      /^\.git\//,
      /^node_modules\//,
      /^\.next\//,
      /^dist\//,
      /^build\//,
      /^\.env/,
      /^\.DS_Store$/,
      /^Thumbs\.db$/,
    ];

    if (skipPatterns.some((pattern) => pattern.test(sourcePath))) {
      console.log(`Skipping ${sourcePath}: matches skip pattern`);
      return;
    }

    // Get file content from source
    const { data: fileData } = await octokit.repos.getContent({
      owner: sourceOwner,
      repo: sourceRepo,
      path: sourcePath,
      ref: sourceBranch,
    });

    // Check file size (GitHub API has 1MB limit for base64 content)
    if (fileData.size && fileData.size > 1000000) {
      console.warn(`Skipping large file ${sourcePath}: ${fileData.size} bytes exceeds GitHub API limit`);
      return;
    }

    // Handle base64 encoded content
    let content: string;
    if (fileData.encoding === "base64") {
      content = fileData.content;
    } else if (fileData.content) {
      // If not base64, encode it
      content = Buffer.from(fileData.content).toString("base64");
    } else {
      throw new Error(`File ${sourcePath} has no content`);
    }

    // Create file in target repository
    await octokit.repos.createOrUpdateFileContents({
      owner: targetOwner,
      repo: targetRepo,
      path: targetPath,
      message: `Copy from template: ${sourcePath}`,
      content: content,
      branch: "main",
    });
  } catch (error: any) {
    // Skip files larger than 1MB (GitHub API limitation)
    if (error.status === 422) {
      if (error.message?.includes("too large") || error.message?.includes("size")) {
        console.warn(`Skipping large file ${sourcePath}: exceeds GitHub API limit`);
        return;
      }
    }
    // Skip 404 errors (file might have been deleted)
    if (error.status === 404) {
      console.warn(`Skipping ${sourcePath}: not found in source repository`);
      return;
    }
    // Skip 403 errors (might not have access)
    if (error.status === 403) {
      console.warn(`Skipping ${sourcePath}: access denied`);
      return;
    }
    throw error;
  }
}

/**
 * Get all files recursively from a repository (excluding .git, node_modules, etc.)
 */
export async function getAllFilesFromRepo(
  owner: string,
  repo: string,
  path: string = ""
): Promise<Array<{ path: string; type: string; size: number }>> {
  const octokit = await getAuthenticatedClient();
  const files: Array<{ path: string; type: string; size: number }> = [];

  const ignoredPaths = [".git", "node_modules", ".next", "dist", "build"];

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: path || "",
    });

    if (Array.isArray(data)) {
      for (const item of data) {
        // Skip ignored directories
        if (ignoredPaths.some((ignored) => item.path.includes(ignored))) {
          continue;
        }

        if (item.type === "file") {
          files.push({
            path: item.path,
            type: item.type,
            size: item.size || 0,
          });
        } else if (item.type === "dir") {
          const subFiles = await getAllFilesFromRepo(owner, repo, item.path);
          files.push(...subFiles);
        }
      }
    } else if (data.type === "file") {
      files.push({
        path: data.path,
        type: data.type,
        size: data.size || 0,
      });
    }
  } catch (error: any) {
    if (error.status !== 404) {
      throw error;
    }
  }

  return files;
}

