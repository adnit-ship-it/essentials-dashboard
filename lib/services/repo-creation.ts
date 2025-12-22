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

  // 2. Get installation info to verify account and determine endpoint
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
        type: installation.account?.type || "", // "User" or "Organization"
      };
      
      console.log(`📋 Installation account: ${installationAccount.login} (${installationAccount.type})`);
      
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
      throw error; // Re-throw our custom error
    }
    console.warn(`⚠️  Could not verify installation account: ${error.message}`);
    // Continue anyway - we'll try to create and see what happens
  }

  // 3. Check if repository already exists in adnit-ship-it
  try {
    await octokit.repos.get({
      owner: DEFAULT_ORG,
      repo: newRepoName,
    });
    // If we get here, repo exists
    throw new Error(
      `Repository "${newRepoName}" already exists in the ${DEFAULT_ORG} account. Please choose a different name.`
    );
  } catch (error: any) {
    if (error.status === 404) {
      // Repo doesn't exist, proceed with creation
    } else if (error.message?.includes("already exists")) {
      // Re-throw our custom error
      throw error;
    } else {
      // Some other error accessing the repo, log and continue
      console.warn(`Could not check if repo exists: ${error.message}`);
    }
  }

  // 4. Create the new repository
  // Use /user/repos for personal accounts, /orgs/{org}/repos for organizations
  let newRepo;
  try {
    // Log installation account info for debugging
    console.log(`🔍 Installation account:`, {
      login: installationAccount?.login || "unknown",
      type: installationAccount?.type || "unknown",
      isOrganization: installationAccount?.type === "Organization"
    });
    
    const isOrganization = installationAccount?.type === "Organization";
    
    // Default to user endpoint if we can't determine account type (safer for personal accounts)
    // Only use org endpoint if we're CERTAIN it's an organization
    if (isOrganization && installationAccount !== null) {
      // For organizations, use org endpoint
      console.log(`🏢 Creating repository in organization "${DEFAULT_ORG}"`);
      const { data } = await octokit.request("POST /orgs/{org}/repos", {
        org: DEFAULT_ORG,
        name: newRepoName,
        description: description || `Created from template ${templateRepo.name}`,
        private: isPrivate,
        auto_init: false,
      });
      newRepo = data;
    } else {
      // For personal accounts OR if we can't determine, use user endpoint
      // The repo will be created under the authenticated user (installation account)
      console.log(`👤 Creating repository in personal account "${DEFAULT_ORG}" (using /user/repos endpoint)`);
      const { data } = await octokit.request("POST /user/repos", {
        name: newRepoName,
        description: description || `Created from template ${templateRepo.name}`,
        private: isPrivate,
        auto_init: false,
      });
      newRepo = data;
      
      // Verify the repo was created under the correct account
      if (newRepo.owner.login !== DEFAULT_ORG) {
        throw new Error(
          `Repository was created under "${newRepo.owner.login}" instead of "${DEFAULT_ORG}". ` +
          `Please verify your GitHub App installation is on the correct account.`
        );
      }
    }
    
    console.log(`✅ Repository created: ${newRepo.full_name}`);
  } catch (error: any) {
    // If we got a 404 on org endpoint and account type is not Organization, try user endpoint as fallback
    if (error.status === 404 && installationAccount?.type !== "Organization") {
      console.log(`⚠️  Org endpoint failed with 404, trying user endpoint as fallback...`);
      try {
        const { data } = await octokit.request("POST /user/repos", {
          name: newRepoName,
          description: description || `Created from template ${templateRepo.name}`,
          private: isPrivate,
          auto_init: false,
        });
        newRepo = data;
        
        if (newRepo.owner.login !== DEFAULT_ORG) {
          throw new Error(
            `Repository was created under "${newRepo.owner.login}" instead of "${DEFAULT_ORG}". ` +
            `Please verify your GitHub App installation is on the correct account.`
          );
        }
        
        console.log(`✅ Repository created via fallback: ${newRepo.full_name}`);
      } catch (fallbackError: any) {
        // If fallback also fails, throw with helpful error
        if (fallbackError.status === 403) {
          throw new Error(
            `GitHub App installation does not have permission to create repositories. ` +
            `Please go to https://github.com/settings/apps, select your app, click "Install App", ` +
            `then "Configure" on your installation, and ensure "Administration: Read and write" permission is granted.`
          );
        }
        throw fallbackError;
      }
    } else if (error.status === 403) {
      // If creation fails with 403, provide helpful error
      throw new Error(
        `GitHub App installation does not have permission to create repositories. ` +
        `Please go to https://github.com/settings/apps, select your app, click "Install App", ` +
        `then "Configure" on your installation, and ensure "Administration: Read and write" permission is granted.`
      );
    } else if (error.status === 404) {
      throw new Error(
        `Account "${DEFAULT_ORG}" not found or you don't have permission to create repos there. ` +
        `Please verify the GitHub App is installed on "${DEFAULT_ORG}" and has the correct permissions.`
      );
    } else if (error.status === 422 && error.message?.includes("already exists")) {
      // Check if it's a name conflict (422 status)
      throw new Error(
        `Repository "${newRepoName}" already exists in the ${DEFAULT_ORG} account. Please choose a different name.`
      );
    } else {
      throw new Error(
        `Failed to create repository in "${DEFAULT_ORG}": ${error.message || "Unknown error"}`
      );
    }
  }

  // 2. Get default branch from template repo
  let templateBranch = "main";
  try {
    const { data: templateRepoData } = await octokit.repos.get({
      owner: templateRepo.owner,
      repo: templateRepo.repo,
    });
    templateBranch = templateRepoData.default_branch || "main";
  } catch (error: any) {
    console.warn(`Could not fetch template repo default branch, using 'main': ${error.message}`);
  }

  // 3. Copy files from template to new repo
  try {
    await copyRepoContents(
      octokit,
      templateRepo.owner,
      templateRepo.repo,
      newRepo.owner.login,
      newRepo.name,
      "",
      "",
      templateBranch
    );
  } catch (error: any) {
    // If copying fails, we should ideally delete the created repo
    // But for now, just throw the error with more context
    console.error("Error copying files, but repository was created:", error);
    const repoFullName = newRepo.full_name || `${newRepo.owner.login}/${newRepo.name}`;
    throw new Error(
      `Repository created but failed to copy files: ${error.message || "Unknown error"}. The repository "${repoFullName}" was created but may be incomplete.`
    );
  }

  return {
    owner: newRepo.owner.login,
    repo: newRepo.name,
    fullName: newRepo.full_name || `${newRepo.owner.login}/${newRepo.name}`,
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

