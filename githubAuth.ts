import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest"; // We import the Octokit class with all plugins

// Define the structure we expect for the file response from GitHub API
export interface GitHubFileResponse {
  content: string | null; // Base64 encoded content
  sha: string; // The required SHA hash for updates
  type: "file" | "dir" | "symlink";
}

/**
 * Generates a temporary, authenticated Octokit client instance for the specific installation.
 * @returns A ready-to-use Octokit client with full API methods.
 */
export async function getAuthenticatedClient(): Promise<Octokit> {
  // --- Configuration Loading (load inside function) ---
  const APP_ID = process.env.GITHUB_APP_CLIENT_ID;
  const PRIVATE_KEY_RAW = process.env.GITHUB_PRIVATE_KEY;
  const INSTALLATION_ID = process.env.GITHUB_INSTALLATION_ID;

  // Type check to ensure all required environment variables are present
  if (!APP_ID || !PRIVATE_KEY_RAW || !INSTALLATION_ID) {
    throw new Error(
      "❌ Missing critical GitHub App environment variables (ID, Key, or Installation ID): " +
        `APP_ID="${APP_ID}", PRIVATE_KEY_RAW="${
          PRIVATE_KEY_RAW ? "Loaded" : "Missing"
        }", INSTALLATION_ID="${INSTALLATION_ID}"`
    );
  }

  // Fix private key formatting: replace literal \n with actual newlines
  // This handles cases where the key is stored in .env with \n escape sequences
  const PRIVATE_KEY = PRIVATE_KEY_RAW.replace(/\\n/g, '\n');

  // 1. Initialize the GitHub App instance
  const app = new App({
    appId: APP_ID,
    privateKey: PRIVATE_KEY,
    //
    // *** THE FIX IS HERE ***
    // Explicitly pass the Octokit class that includes all plugins (like .repos)
    Octokit: Octokit,
    //
  });

  try {
    // Octokit's App class handles the token generation and returns an authenticated Octokit instance.
    const octokit = await app.getInstallationOctokit(parseInt(INSTALLATION_ID));

    // No longer need the 'as unknown as Octokit' cast
    return octokit;
  } catch (error) {
    console.error("Authentication Error during token generation:", error);
    throw new Error("Failed to authenticate with GitHub App.");
  }
}

// Optional: Define an interface for the data sent to the frontend
export interface DashboardContentData {
  content: any; // The parsed JSON object from WebsiteContent.json
  sha: string; // The SHA hash needed for future writes
}
