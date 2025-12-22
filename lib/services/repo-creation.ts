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

  console.log(`🚀 Starting repository creation from template`);
  console.log(`📦 Template: ${templateRepo.id} (${templateRepo.name})`);
  console.log(`📝 New repository name: ${newRepoName}`);
  console.log(`🔒 Private: ${isPrivate}`);
  console.log(`📄 Description: ${description || "None"}`);

  // 1. Validate template repo exists and is accessible
  console.log(`\n📋 Step 1: Validating template repository...`);
  try {
    console.log(`   Checking template: ${templateRepo.owner}/${templateRepo.repo}`);
    const templateCheck = await octokit.repos.get({
      owner: templateRepo.owner,
      repo: templateRepo.repo,
    });
    console.log(`   ✅ Template repository is accessible`);
    console.log(`   Template default branch: ${templateCheck.data.default_branch || "main"}`);
    console.log(`   Template is template: ${templateCheck.data.is_template || false}`);
  } catch (error: any) {
    console.error(`   ❌ Template validation failed:`, {
      status: error.status,
      message: error.message,
      response: error.response?.data,
    });
    if (error.status === 404) {
      throw new Error(`Template repository "${templateRepo.id}" not found or not accessible`);
    }
    throw new Error(`Failed to access template repository: ${error.message || "Unknown error"}`);
  }

  // 2. Get installation info to verify account and determine endpoint
  console.log(`\n📋 Step 2: Checking GitHub App installation...`);
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
      
      // Log the actual permissions granted to this installation
      console.log(`🔐 Installation permissions:`, JSON.stringify(installation.permissions, null, 2));
      
      // Check if administration permission is granted
      const adminPermission = installation.permissions?.administration;
      if (adminPermission !== "write") {
        console.warn(`⚠️  Administration permission is "${adminPermission}" but needs to be "write"`);
        console.warn(`   To fix: Go to https://github.com/settings/apps, select your app, click "Install App",`);
        console.warn(`   then "Configure" on the ${installationAccount.login} installation, and accept updated permissions.`);
      }
      
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
  console.log(`\n📋 Step 3: Checking if repository name is available...`);
  try {
    console.log(`   Checking: ${DEFAULT_ORG}/${newRepoName}`);
    await octokit.repos.get({
      owner: DEFAULT_ORG,
      repo: newRepoName,
    });
    // If we get here, repo exists
    console.error(`   ❌ Repository "${newRepoName}" already exists!`);
    throw new Error(
      `Repository "${newRepoName}" already exists in the ${DEFAULT_ORG} account. Please choose a different name.`
    );
  } catch (error: any) {
    if (error.status === 404) {
      // Repo doesn't exist, proceed with creation
      console.log(`   ✅ Repository name "${newRepoName}" is available`);
    } else if (error.message?.includes("already exists")) {
      // Re-throw our custom error
      throw error;
    } else {
      // Some other error accessing the repo, log and continue
      console.warn(`   ⚠️  Could not check if repo exists: ${error.message}`);
      console.warn(`   Continuing anyway...`);
    }
  }

  // 4. Create the new repository using template endpoint
  // The template endpoint works for both personal accounts and organizations
  // It automatically copies all files from the template, so no manual copying needed
  console.log(`\n📋 Step 4: Creating repository from template...`);
  let newRepo;
  try {
    const isOrganization = installationAccount?.type === "Organization";
    const accountType = isOrganization ? "organization" : "personal account";
    
    console.log(`   Account type: ${accountType} (${installationAccount?.login || "unknown"})`);
    console.log(`   Using template endpoint: POST /repos/{template_owner}/{template_repo}/generate`);
    console.log(`   Template: ${templateRepo.owner}/${templateRepo.repo}`);
    console.log(`   Target owner: ${DEFAULT_ORG}`);
    console.log(`   New repo name: ${newRepoName}`);
    
    const requestParams = {
      template_owner: templateRepo.owner,
      template_repo: templateRepo.repo,
      owner: DEFAULT_ORG,
      name: newRepoName,
      description: description || `Created from template ${templateRepo.name}`,
      private: isPrivate,
    };
    
    console.log(`   Request parameters:`, JSON.stringify(requestParams, null, 2));
    console.log(`   Making API request...`);
    
    const { data } = await octokit.request("POST /repos/{template_owner}/{template_repo}/generate", requestParams);
    newRepo = data;
    
    console.log(`   ✅ Repository created successfully!`);
    console.log(`   Repository: ${newRepo.full_name}`);
    console.log(`   URL: ${newRepo.html_url}`);
    console.log(`   Default branch: ${newRepo.default_branch}`);
    console.log(`   Private: ${newRepo.private}`);
    console.log(`   Created at: ${newRepo.created_at}`);
    
    // Verify the repo was created under the correct account
    if (newRepo.owner.login !== DEFAULT_ORG) {
      console.error(`   ⚠️  WARNING: Repository created under "${newRepo.owner.login}" instead of "${DEFAULT_ORG}"`);
      throw new Error(
        `Repository was created under "${newRepo.owner.login}" instead of "${DEFAULT_ORG}". ` +
        `Please verify your GitHub App installation is on the correct account.`
      );
    }
    
    console.log(`   ✅ Verified: Repository is under correct account (${DEFAULT_ORG})`);
    
  } catch (error: any) {
    console.error(`\n   ❌ Repository creation failed!`);
    console.error(`   Error status: ${error.status}`);
    console.error(`   Error message: ${error.message}`);
    console.error(`   Full error response:`, JSON.stringify({
      status: error.status,
      message: error.message,
      response: error.response?.data,
      headers: error.response?.headers,
    }, null, 2));
    
    if (error.status === 403) {
      const githubMessage = error.response?.data?.message || error.message;
      console.error(`   GitHub API Error: ${githubMessage}`);
      throw new Error(
        `GitHub App installation does not have permission to create repositories. ` +
        `Error: ${githubMessage}. ` +
        `Please go to https://github.com/settings/apps, select your app, click "Install App", ` +
        `then "Configure" on your installation, and ensure "Administration: Read and write" permission is granted.`
      );
    }
    if (error.status === 404) {
      const githubMessage = error.response?.data?.message || error.message;
      console.error(`   GitHub API Error: ${githubMessage}`);
      throw new Error(
        `Template repository "${templateRepo.id}" not found or account "${DEFAULT_ORG}" not accessible. ` +
        `Error: ${githubMessage}. ` +
        `Please verify the template repository exists and the GitHub App is installed on "${DEFAULT_ORG}".`
      );
    }
    // Check if it's a name conflict (422 status)
    if (error.status === 422) {
      const githubMessage = error.response?.data?.message || error.message;
      console.error(`   GitHub API Error: ${githubMessage}`);
      if (githubMessage?.includes("already exists") || error.message?.includes("already exists")) {
        throw new Error(
          `Repository "${newRepoName}" already exists in the ${DEFAULT_ORG} account. Please choose a different name.`
        );
      }
      throw new Error(
        `Failed to create repository: ${githubMessage || error.message}`
      );
    }
    throw new Error(
      `Failed to create repository from template: ${error.message || "Unknown error"}`
    );
  }

  // Note: The template endpoint automatically copies all files from the template,
  // so we don't need to manually copy files. The repository is ready to use!
  console.log(`\n✅ Repository creation complete!`);
  console.log(`   Repository: ${newRepo.full_name}`);
  console.log(`   All template files have been automatically copied.`);

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

