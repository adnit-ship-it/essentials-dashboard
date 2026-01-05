// Script to check your GitHub App installations
// Run with: node check-installation.js

import dotenv from "dotenv";
import { App } from "@octokit/app";

// Load environment variables
dotenv.config({ path: ".env.local" });

const APP_ID = process.env.GITHUB_APP_CLIENT_ID;
const PRIVATE_KEY_RAW = process.env.GITHUB_PRIVATE_KEY;

if (!APP_ID || !PRIVATE_KEY_RAW) {
  console.error("❌ Missing GITHUB_APP_CLIENT_ID or GITHUB_PRIVATE_KEY in .env.local");
  process.exit(1);
}

// Fix private key formatting
const PRIVATE_KEY = PRIVATE_KEY_RAW.replace(/\\n/g, '\n');

async function checkInstallations() {
  try {
    // Initialize the app
    const app = new App({
      appId: APP_ID,
      privateKey: PRIVATE_KEY,
    });


    // Get all installations
    const { data: installations } = await app.octokit.request(
      "GET /app/installations",
      {
        headers: {
          accept: "application/vnd.github.v3+json",
        },
      }
    );

    console.log(`\n✅ Found ${installations.length} installation(s):\n`);

    for (const installation of installations) {
      const accountName = installation.account?.login || installation.account?.name || "Unknown";
      const accountType = installation.account?.type || "Unknown";
      const installationId = installation.id;
      
      console.log(`📦 Installation ID: ${installationId}`);
      console.log(`   Account: ${accountName} (${accountType})`);
      console.log(`   URL: https://github.com/settings/installations/${installationId}`);
      
      // Get repositories for this installation (with pagination)
      try {
        const octokit = await app.getInstallationOctokit(installation.id);
        
        // Fetch all pages of repositories
        let allRepos = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const { data: repos } = await octokit.request("GET /installation/repositories", {
            per_page: 100, // Max per page
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
        
        if (allRepos.length === 0) {
          console.log(`   Repositories: None (or access not granted)`);
        } else {
          console.log(`   Repositories (${allRepos.length} total):`);
          allRepos.forEach((repo) => {
            console.log(`     - ${repo.full_name}`);
          });
        }
      } catch (error) {
        console.log(`   ⚠️  Could not fetch repositories: ${error.message}`);
      }
      
      console.log(""); // Empty line between installations
    }

    // Show which installation ID is currently configured
    const currentInstallationId = process.env.GITHUB_INSTALLATION_ID;
    if (currentInstallationId) {
      const found = installations.find(i => i.id.toString() === currentInstallationId);
      if (found) {
        const accountName = found.account?.login || found.account?.name || "Unknown";
        console.log(`✅ Current GITHUB_INSTALLATION_ID (${currentInstallationId}) matches installation for: ${accountName}`);
      } else {
        console.log(`⚠️  Current GITHUB_INSTALLATION_ID (${currentInstallationId}) does NOT match any installation!`);
        console.log(`   Please update your .env.local file with one of the Installation IDs listed above.`);
      }
    } else {
      console.log(`⚠️  GITHUB_INSTALLATION_ID not set in .env.local`);
      console.log(`   Please add it using one of the Installation IDs listed above.`);
    }

  } catch (error) {
    console.error("❌ Error checking installations:", error.message);
    if (error.message.includes("Bad credentials")) {
      console.error("\n⚠️  Your GITHUB_PRIVATE_KEY might be incorrect or not properly formatted.");
    }
  }
}

checkInstallations();





