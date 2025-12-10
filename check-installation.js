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


    for (const installation of installations) {
      // Get repositories for this installation
      try {
        const octokit = await app.getInstallationOctokit(installation.id);
        const { data: repos } = await octokit.request("GET /installation/repositories");
        
        if (repos.repositories.length === 0) {
        } else {
          repos.repositories.forEach((repo) => {
          });
        }
      } catch (error) {
      }
      
    }

  } catch (error) {
    console.error("❌ Error checking installations:", error.message);
    if (error.message.includes("Bad credentials")) {
      console.error("\n⚠️  Your GITHUB_PRIVATE_KEY might be incorrect or not properly formatted.");
    }
  }
}

checkInstallations();





