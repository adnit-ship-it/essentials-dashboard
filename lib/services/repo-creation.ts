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
 * Waits for the repository to be populated with files from the template
 * Polls the repository root until files are available or max attempts reached
 * @param octokit - Authenticated GitHub client
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param maxAttempts - Maximum number of attempts (default: 10)
 * @param delayMs - Delay between attempts in milliseconds (default: 2000)
 * @returns true if repository has content, false otherwise
 */
async function waitForRepositoryContent(
  octokit: any,
  owner: string,
  repo: string,
  maxAttempts: number = 10,
  delayMs: number = 2000
): Promise<boolean> {
  console.log(`[RepoCreation] Waiting for repository ${owner}/${repo} to be populated...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Try to list the root directory contents
      console.log(`[RepoCreation] Attempt ${attempt}/${maxAttempts}: Checking repository content...`);
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: "",
        ref: "main",
      });
      
      // If we get an array, the repo has content
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[RepoCreation] ✅ Repository populated with ${data.length} items after ${attempt} attempt(s)`);
        return true;
      }
      
      // If we get a single file (unlikely for root), it still has content
      if (data && !Array.isArray(data) && data.type === "file") {
        console.log(`[RepoCreation] ✅ Repository has content (single file at root)`);
        return true;
      }
      
      // Empty array or unexpected response - wait and retry
      if (attempt < maxAttempts) {
        console.log(`[RepoCreation] ⏳ Repository appears empty, waiting ${delayMs}ms before retry ${attempt}/${maxAttempts}...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error: any) {
      // 404 means repo is empty or doesn't exist yet
      if (error.status === 404) {
        if (attempt < maxAttempts) {
          console.log(`[RepoCreation] ⏳ Repository not yet populated (404), waiting ${delayMs}ms before retry ${attempt}/${maxAttempts}...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          console.warn(`[RepoCreation] ⚠️ Repository still empty after ${maxAttempts} attempts`);
          return false;
        }
      } else {
        // Other error - log and return false
        console.error(`[RepoCreation] ❌ Error checking repository content:`, error.message);
        return false;
      }
    }
  }
  
  return false;
}

/**
 * Updates the hostTemplate.json file with the Vercel deployment URL
 * Reads the existing file, updates only the hostedAt field, and commits it back
 * If the file doesn't exist, creates it with the deployment URL
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
  console.log(`[HostTemplate] ===== Starting updateHostTemplate =====`);
  console.log(`[HostTemplate] Parameters:`, { owner, repo, deploymentUrl });
  
  const filePath = "data/hostTemplate.json";
  console.log(`[HostTemplate] Target file path: ${filePath}`);
  
  let fileExists = false;
  let fileData: any;
  
  try {
    // Try to read the existing hostTemplate.json file
    console.log(`[HostTemplate] Attempting to read file from repository...`);
    console.log(`[HostTemplate] API call: GET /repos/${owner}/${repo}/contents/${filePath}?ref=main`);
    
    try {
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: "main",
      });
      fileData = response.data;
      fileExists = true;
      
      console.log(`[HostTemplate] File read response received`);
      console.log(`[HostTemplate] File data type: ${fileData.type}`);
      console.log(`[HostTemplate] File has content: ${!!fileData.content}`);
      console.log(`[HostTemplate] File SHA: ${fileData.sha}`);
    } catch (error: any) {
      if (error.status === 404) {
        // File doesn't exist - we'll create it
        fileExists = false;
        console.log(`[HostTemplate] File doesn't exist (404), will create it`);
      } else {
        throw error;
      }
    }

    let hostTemplate: any;
    let contentBase64: string;

    if (fileExists && fileData.content && fileData.type === "file") {
      // File exists - update it
      console.log(`[HostTemplate] File exists, updating it...`);
      
      // Decode the base64 content
      console.log(`[HostTemplate] Decoding base64 content...`);
      const contentString = Buffer.from(fileData.content, "base64").toString("utf8");
      console.log(`[HostTemplate] Content length: ${contentString.length} characters`);
      
      hostTemplate = JSON.parse(contentString);
      console.log(`[HostTemplate] Current hostTemplate:`, JSON.stringify(hostTemplate, null, 2));

      // Update only the hostedAt field
      console.log(`[HostTemplate] Updating hostedAt field from "${hostTemplate.hostedAt}" to "${deploymentUrl}"`);
      hostTemplate.hostedAt = deploymentUrl;

      // Encode back to base64
      const updatedContent = JSON.stringify(hostTemplate, null, 2);
      contentBase64 = Buffer.from(updatedContent, "utf8").toString("base64");
      console.log(`[HostTemplate] Updated content encoded to base64, length: ${contentBase64.length}`);
    } else {
      // File doesn't exist - create it
      console.log(`[HostTemplate] Creating new hostTemplate.json file...`);
      const templateName = repo.replace(/^store-/, "").replace(/-/g, " ");
      hostTemplate = {
        hostedAt: deploymentUrl,
        templateName: templateName.charAt(0).toUpperCase() + templateName.slice(1) + " Template",
      };
      const newContent = JSON.stringify(hostTemplate, null, 2);
      contentBase64 = Buffer.from(newContent, "utf8").toString("base64");
      console.log(`[HostTemplate] New file content prepared:`, JSON.stringify(hostTemplate, null, 2));
    }

    // Commit the file (create or update)
    console.log(`[HostTemplate] Committing ${fileExists ? 'updated' : 'new'} file to repository...`);
    console.log(`[HostTemplate] API call: PUT /repos/${owner}/${repo}/contents/${filePath}`);
    console.log(`[HostTemplate] Commit message: "${fileExists ? 'Update' : 'Create'} hostTemplate.json with Vercel deployment URL"`);
    
    const commitResult = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: fileExists 
        ? "Update hostTemplate.json with Vercel deployment URL"
        : "Create hostTemplate.json with Vercel deployment URL",
      content: contentBase64,
      sha: fileExists ? fileData.sha : undefined, // Only include SHA if updating
      branch: "main",
    });

    console.log(`[HostTemplate] Commit successful!`);
    console.log(`[HostTemplate] Commit SHA: ${commitResult.data.commit.sha}`);
    console.log(`[HostTemplate] Commit URL: ${commitResult.data.commit.html_url}`);
    console.log(`[HostTemplate] Successfully ${fileExists ? 'updated' : 'created'} ${filePath} with deployment URL: ${deploymentUrl}`);
    console.log(`[HostTemplate] ===== updateHostTemplate completed successfully =====`);
  } catch (error: any) {
    console.error(`[HostTemplate] ===== Error in updateHostTemplate =====`);
    console.error(`[HostTemplate] Error status: ${error.status}`);
    console.error(`[HostTemplate] Error message: ${error.message}`);
    console.error(`[HostTemplate] Error response:`, error.response?.data);
    
    // Log error but don't fail the entire operation
    const operation = (fileExists !== undefined && fileExists) ? 'update' : 'create';
    console.error(`[HostTemplate] Failed to ${operation} ${filePath}:`, error.message);
    console.error(`[HostTemplate] ===== updateHostTemplate failed =====`);
  }
}

/**
 * Links a GitHub repository to Vercel and creates a project
 * @param repoName - The name of the repository (e.g., "store-my-app")
 * @returns The deployment URL (e.g., "https://store-my-app.vercel.app")
 */
async function linkToVercel(repoName: string): Promise<string> {
  console.log(`[Vercel] ===== Starting linkToVercel =====`);
  console.log(`[Vercel] Repository name: ${repoName}`);
  
  const vercelToken = process.env.VERCEL_TOKEN;
  console.log(`[Vercel] VERCEL_TOKEN exists: ${!!vercelToken}`);
  console.log(`[Vercel] VERCEL_TOKEN length: ${vercelToken ? vercelToken.length : 0} characters`);
  
  if (!vercelToken) {
    console.error(`[Vercel] VERCEL_TOKEN is missing!`);
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
    console.log(`[Vercel] Request URL: https://api.vercel.com/v9/projects`);
    console.log(`[Vercel] Request method: POST`);
    console.log(`[Vercel] Request body:`, JSON.stringify(requestBody, null, 2));
    console.log(`[Vercel] Git repository: ${DEFAULT_ORG}/${repoName}`);

    const response = await fetch("https://api.vercel.com/v9/projects", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[Vercel] Response received`);
    console.log(`[Vercel] Response status: ${response.status} ${response.statusText}`);
    console.log(`[Vercel] Response headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`[Vercel] Response text length: ${responseText.length} characters`);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`[Vercel] Response parsed as JSON successfully`);
    } catch (parseError) {
      console.error(`[Vercel] Failed to parse response as JSON`);
      console.error(`[Vercel] Response text (first 500 chars):`, responseText.substring(0, 500));
      responseData = { raw: responseText };
    }

    console.log(`[Vercel] Response body:`, JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error(`[Vercel] Request failed with status ${response.status}`);
      throw new Error(
        `Failed to create Vercel project: ${response.status} ${response.statusText}. ${JSON.stringify(responseData)}`
      );
    }

    // Use the actual project name from Vercel's response (normalized, e.g., underscores removed)
    // Vercel normalizes project names, so 'store-dr_drip' becomes 'store-drdrip'
    const actualProjectName = responseData.name || repoName;
    const deploymentUrl = `https://${actualProjectName}.vercel.app`;
    
    console.log(`[Vercel] Project created successfully!`);
    console.log(`[Vercel] Requested name: ${repoName}`);
    console.log(`[Vercel] Actual project name: ${actualProjectName} (normalized from ${repoName})`);
    console.log(`[Vercel] Project ID: ${responseData.id}`);
    console.log(`[Vercel] Deployment URL: ${deploymentUrl}`);
    console.log(`[Vercel] ===== linkToVercel completed successfully =====`);
    
    return deploymentUrl;
  } catch (error: any) {
    console.error(`[Vercel] ===== Error in linkToVercel =====`);
    console.error(`[Vercel] Error type: ${error.constructor.name}`);
    console.error(`[Vercel] Error message: ${error.message}`);
    console.error(`[Vercel] Error stack:`, error.stack);
    
    // If it's already our error, re-throw it
    if (error.message?.includes("Failed to create Vercel project") || error.message?.includes("VERCEL_TOKEN")) {
      console.error(`[Vercel] Re-throwing known error`);
      throw error;
    }
    // Otherwise wrap it
    console.error(`[Vercel] Wrapping unexpected error`);
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
  console.log(`[RepoCreation] ===== Starting createRepoFromTemplate =====`);
  console.log(`[RepoCreation] Input parameters:`, {
    templateRepo: templateRepo.id,
    newRepoName,
    description,
    isPrivate,
  });
  
  console.log(`[RepoCreation] Getting authenticated GitHub client...`);
  const octokit = await getAuthenticatedClient();
  console.log(`[RepoCreation] Authenticated client obtained`);

  // Add "store-" prefix if not already present
  const prefixedName = newRepoName.startsWith("store-") 
    ? newRepoName 
    : `store-${newRepoName}`;
  console.log(`[RepoCreation] Repository name: "${newRepoName}" -> prefixed name: "${prefixedName}"`);

  // 1. Validate template repo exists and is accessible
  console.log(`[RepoCreation] Step 1: Validating template repository exists...`);
  console.log(`[RepoCreation] Template repo: ${templateRepo.owner}/${templateRepo.repo}`);
  console.log(`[RepoCreation] Template repo ID: ${templateRepo.id}`);
  
  try {
    console.log(`[RepoCreation] API call: GET /repos/${templateRepo.owner}/${templateRepo.repo}`);
    const templateRepoInfo = await octokit.repos.get({
      owner: templateRepo.owner,
      repo: templateRepo.repo,
    });
    console.log(`[RepoCreation] Template repository found and accessible`);
    console.log(`[RepoCreation] Template repo full name: ${templateRepoInfo.data.full_name}`);
    console.log(`[RepoCreation] Template repo is template: ${templateRepoInfo.data.is_template}`);
    console.log(`[RepoCreation] Template repo default branch: ${templateRepoInfo.data.default_branch}`);
  } catch (error: any) {
    console.error(`[RepoCreation] Failed to access template repository`);
    console.error(`[RepoCreation] Error status: ${error.status}`);
    console.error(`[RepoCreation] Error message: ${error.message}`);
    if (error.status === 404) {
      throw new Error(`Template repository "${templateRepo.id}" not found or not accessible`);
    }
    throw new Error(`Failed to access template repository: ${error.message || "Unknown error"}`);
  }

  // 2. Verify installation is on the correct account
  console.log(`[RepoCreation] Step 2: Verifying GitHub App installation...`);
  console.log(`[RepoCreation] Expected organization: ${DEFAULT_ORG}`);
  
  let installationAccount: { login: string; type: string } | null = null;
  try {
    const { App } = await import("@octokit/app");
    const APP_ID = process.env.GITHUB_APP_CLIENT_ID;
    const PRIVATE_KEY_RAW = process.env.GITHUB_PRIVATE_KEY;
    const INSTALLATION_ID = process.env.GITHUB_INSTALLATION_ID;
    
    console.log(`[RepoCreation] APP_ID exists: ${!!APP_ID}`);
    console.log(`[RepoCreation] PRIVATE_KEY exists: ${!!PRIVATE_KEY_RAW}`);
    console.log(`[RepoCreation] INSTALLATION_ID: ${INSTALLATION_ID}`);
    
    if (APP_ID && PRIVATE_KEY_RAW && INSTALLATION_ID) {
      const PRIVATE_KEY = PRIVATE_KEY_RAW.replace(/\\n/g, '\n');
      const app = new App({
        appId: APP_ID,
        privateKey: PRIVATE_KEY,
      });
      
      console.log(`[RepoCreation] API call: GET /app/installations/${INSTALLATION_ID}`);
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
      
      console.log(`[RepoCreation] Installation account: ${installationAccount.login} (${installationAccount.type})`);
      
      // Verify installation is on the correct account
      if (installationAccount.login !== DEFAULT_ORG) {
        console.error(`[RepoCreation] Installation account mismatch!`);
        console.error(`[RepoCreation] Expected: ${DEFAULT_ORG}, Got: ${installationAccount.login}`);
        throw new Error(
          `GitHub App installation is on "${installationAccount.login}" (${installationAccount.type}), ` +
          `but repositories must be created under "${DEFAULT_ORG}". ` +
          `Please install the app on "${DEFAULT_ORG}" or update DEFAULT_ORG in the code.`
        );
      }
      console.log(`[RepoCreation] Installation account verified correctly`);
    } else {
      console.warn(`[RepoCreation] Missing GitHub App credentials, skipping installation verification`);
    }
  } catch (error: any) {
    console.error(`[RepoCreation] Error during installation verification`);
    console.error(`[RepoCreation] Error status: ${error.status}`);
    console.error(`[RepoCreation] Error message: ${error.message}`);
    if (error.message?.includes("GitHub App installation is on")) {
      throw error;
    }
    // Continue if we can't verify - the API call will fail with a clear error if there's an issue
    console.warn(`[RepoCreation] Continuing despite verification error - API call will fail if there's an issue`);
  }

  // 3. Check if repository already exists (using prefixed name)
  console.log(`[RepoCreation] Step 3: Checking if repository already exists...`);
  console.log(`[RepoCreation] Checking: ${DEFAULT_ORG}/${prefixedName}`);
  
  try {
    console.log(`[RepoCreation] API call: GET /repos/${DEFAULT_ORG}/${prefixedName}`);
    const existingRepo = await octokit.repos.get({
      owner: DEFAULT_ORG,
      repo: prefixedName,
    });
    // If we get here, repo exists
    console.error(`[RepoCreation] Repository already exists!`);
    console.error(`[RepoCreation] Repository URL: ${existingRepo.data.html_url}`);
    throw new Error(
      `Repository "${prefixedName}" already exists in the ${DEFAULT_ORG} account. Please choose a different name.`
    );
  } catch (error: any) {
    if (error.status === 404) {
      // Repo doesn't exist, proceed with creation
      console.log(`[RepoCreation] Repository does not exist (404), proceeding with creation`);
    } else if (error.message?.includes("already exists")) {
      console.error(`[RepoCreation] Repository exists error thrown`);
      throw error;
    } else {
      console.warn(`[RepoCreation] Unexpected error checking repository: ${error.status} - ${error.message}`);
      console.warn(`[RepoCreation] Continuing anyway - API will handle it`);
      // Some other error - continue anyway, API will handle it
    }
  }

  // 4. Create the new repository using template endpoint
  // The template endpoint works for both personal accounts and organizations
  // It automatically copies all files from the template
  console.log(`[RepoCreation] Step 4: Creating repository from template...`);
  console.log(`[RepoCreation] Template: ${templateRepo.owner}/${templateRepo.repo}`);
  console.log(`[RepoCreation] Target: ${DEFAULT_ORG}/${prefixedName}`);
  console.log(`[RepoCreation] Description: ${description || `Created from template ${templateRepo.name}`}`);
  console.log(`[RepoCreation] Private: ${isPrivate}`);
  
  let newRepo;
  try {
    console.log(`[RepoCreation] API call: POST /repos/${templateRepo.owner}/${templateRepo.repo}/generate`);
    const requestParams = {
      template_owner: templateRepo.owner,
      template_repo: templateRepo.repo,
      owner: DEFAULT_ORG,
      name: prefixedName,
      description: description || `Created from template ${templateRepo.name}`,
      private: isPrivate,
    };
    console.log(`[RepoCreation] Request parameters:`, JSON.stringify(requestParams, null, 2));
    
    const { data } = await octokit.request("POST /repos/{template_owner}/{template_repo}/generate", requestParams);
    newRepo = data;
    
    console.log(`[RepoCreation] Repository created successfully!`);
    console.log(`[RepoCreation] Repository ID: ${newRepo.id}`);
    console.log(`[RepoCreation] Repository full name: ${newRepo.full_name}`);
    console.log(`[RepoCreation] Repository URL: ${newRepo.html_url}`);
    console.log(`[RepoCreation] Repository owner: ${newRepo.owner.login} (${newRepo.owner.type})`);
    console.log(`[RepoCreation] Repository default branch: ${newRepo.default_branch}`);
    console.log(`[RepoCreation] Repository is private: ${newRepo.private}`);
    console.log(`[RepoCreation] Repository created at: ${newRepo.created_at}`);
    
    // Verify the repo was created under the correct account
    if (newRepo.owner.login !== DEFAULT_ORG) {
      console.error(`[RepoCreation] Repository owner mismatch!`);
      console.error(`[RepoCreation] Expected: ${DEFAULT_ORG}, Got: ${newRepo.owner.login}`);
      throw new Error(
        `Repository was created under "${newRepo.owner.login}" instead of "${DEFAULT_ORG}". ` +
        `Please verify your GitHub App installation is on the correct account.`
      );
    }
    console.log(`[RepoCreation] Repository owner verified correctly`);
    
    // Wait for GitHub to populate the repository with files from the template
    console.log(`[RepoCreation] Waiting for repository to be populated with template files...`);
    const repoPopulated = await waitForRepositoryContent(
      octokit,
      newRepo.owner.login,
      newRepo.name,
      10, // max 10 attempts
      2000 // 2 second delay between attempts
    );
    
    if (!repoPopulated) {
      console.warn(`[RepoCreation] ⚠️ Repository ${newRepo.name} may still be empty. Proceeding anyway, but operations may fail.`);
    } else {
      console.log(`[RepoCreation] ✅ Repository is populated and ready!`);
    }
  } catch (error: any) {
    console.error(`[RepoCreation] Failed to create repository from template`);
    console.error(`[RepoCreation] Error status: ${error.status}`);
    console.error(`[RepoCreation] Error message: ${error.message}`);
    console.error(`[RepoCreation] Error response:`, error.response?.data);
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
  console.log(`[RepoCreation] Step 5: Linking repository to Vercel...`);
  let deploymentUrl: string;
  console.log(`[RepoCreation] Repository name for Vercel: ${newRepo.name}`);
  console.log(`[RepoCreation] VERCEL_TOKEN exists: ${!!process.env.VERCEL_TOKEN}`);
  
  try {
    deploymentUrl = await linkToVercel(newRepo.name);
    console.log(`[RepoCreation] Vercel project created successfully`);
    console.log(`[RepoCreation] Deployment URL: ${deploymentUrl}`);
  } catch (error: any) {
    // Log the error but don't fail the entire operation
    // The repository was created successfully, Vercel linking can be done manually if needed
    console.error(`[RepoCreation] Vercel project creation failed, but continuing...`);
    console.error(`[RepoCreation] Error:`, error);
    console.error(`[RepoCreation] Error details:`, {
      message: error.message,
      stack: error.stack,
    });
    // Use a placeholder URL - the actual deployment will happen when manually linked
    deploymentUrl = `https://${newRepo.name}.vercel.app`;
    console.log(`[RepoCreation] Using placeholder deployment URL: ${deploymentUrl}`);
  }

  // 6. Update hostTemplate.json with deployment URL (first commit to trigger deployment)
  console.log(`[RepoCreation] Step 6: Updating hostTemplate.json...`);
  console.log(`[RepoCreation] Repository: ${newRepo.owner.login}/${newRepo.name}`);
  console.log(`[RepoCreation] Deployment URL: ${deploymentUrl}`);
  
  try {
    await updateHostTemplate(octokit, newRepo.owner.login, newRepo.name, deploymentUrl);
    console.log(`[RepoCreation] hostTemplate.json updated successfully`);
  } catch (error: any) {
    // Log error but don't fail - the repo and Vercel project are already created
    console.error(`[RepoCreation] hostTemplate.json update failed, but continuing...`);
    console.error(`[RepoCreation] Error: ${error.message}`);
  }

  const result = {
    owner: newRepo.owner.login,
    repo: newRepo.name,
    fullName: newRepo.full_name || `${newRepo.owner.login}/${newRepo.name}`,
    deploymentUrl,
  };
  
  console.log(`[RepoCreation] ===== createRepoFromTemplate completed successfully =====`);
  console.log(`[RepoCreation] Result:`, JSON.stringify(result, null, 2));
  
  return result;
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

