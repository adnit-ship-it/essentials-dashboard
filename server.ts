import dotenv from "dotenv";
// Only load .env.local in development, not in production
if (process.env.NODE_ENV !== 'production') {
  const result = dotenv.config({ path: ".env.local" });
  if (result.error) {
    console.warn("Warning: .env.local not found (this is OK in production)");
  } else {
    console.log(".env.local loaded");
  }
}

import express, { Request, Response } from "express";
import cors from "cors";
import {
  getAuthenticatedClient,
  DashboardContentData,
  GitHubFileResponse,
} from "./githubAuth";
import type { Product } from "./lib/types/products";
import { fetchAvailableRepos } from "./lib/services/repo-discovery";
import {
  getRepoConfig,
  saveRepoConfig,
  getAllRepoConfigs,
  deleteRepoConfig,
  validateRepoPaths,
  createDefaultRepoConfig,
  updateLastAccessed,
} from "./lib/services/repo-config";
import type { RepoConfig } from "./lib/types/repository";

const app = express();
// Increase body size limit to 50MB for image uploads (base64 encoded images can be large)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN 
      ? process.env.FRONTEND_ORIGIN.split(",").map(origin => origin.trim())
      : ["http://localhost:3000", "https://essentials-dashboard.onrender.com"],
    credentials: true,
  })
);

// --- Configuration Constants ---
const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;

// Legacy env vars (for backward compatibility during migration)
const CONTENT_REPO_OWNER = process.env.CONTENT_REPO_OWNER;
const CONTENT_REPO_NAME = process.env.CONTENT_REPO_NAME;
const CONTENT_FILE_PATH = 'data/websiteText.json';
const PRODUCTS_FILE_PATH = "data/intake-form/products.ts";
const TAILWIND_CONFIG_PATH = "tailwind.config.js";
const BRAND_PRIMARY_LOGO_PATH = "public/assets/images/brand/logo.svg";
const BRAND_SECONDARY_LOGO_PATH = "public/assets/images/brand/logo-alt.svg";
const CONTENT_REPO_BRANCH = "main";

// Build active repo config from request query (?owner=&repo=&branch=) with env-defined paths
function getActiveRepoConfigFromRequest(req: Request): {
  owner: string;
  repo: string;
  branch: string;
  contentFilePath: string;
  productsFilePath: string;
  tailwindConfigPath: string;
  brandLogoPath: string;
  brandAltLogoPath: string;
  pagesFilePath: string;
  sectionsFilePath: string;
} {
  const q: any = req.query || {};
  const owner =
    (q.owner as string) ||
    (q["repo-owner"] as string) ||
    (q.repoOwner as string) ||
    process.env.CONTENT_REPO_OWNER ||
    "";
  const repo =
    (q.repo as string) ||
    (q["repo-name"] as string) ||
    (q.repoName as string) ||
    process.env.CONTENT_REPO_NAME ||
    "";
  const branch = (q.branch as string) || process.env.CONTENT_REPO_BRANCH || "main";
  const contentFilePath = process.env.CONTENT_FILE_PATH as string;
  const productsFilePath =
    process.env.CONTENT_PRODUCTS_FILE_PATH || "data/intake-form/products.ts";
  const tailwindConfigPath = process.env.CONTENT_TAILWIND_PATH || "tailwind.config.js";

  const resolveLogoPath = (value?: string, fallback?: string) => {
    if (!value || typeof value !== "string") {
      return fallback || "";
    }
    return normalizeRepoPath(value);
  };

  const brandLogoPath = resolveLogoPath(
    (q.brandLogoPath as string) ||
      (q.primaryLogoPath as string) ||
      process.env.CONTENT_BRAND_LOGO_PATH,
    BRAND_PRIMARY_LOGO_PATH
  );
  const brandAltLogoPath = resolveLogoPath(
    (q.brandAltLogoPath as string) ||
      (q.secondaryLogoPath as string) ||
      process.env.CONTENT_BRAND_ALT_LOGO_PATH,
    BRAND_SECONDARY_LOGO_PATH
  );
  if (!owner || !repo || !contentFilePath) {
    throw new Error(
      "Active repository not specified. Provide ?owner=&repo= (and optional ?branch=), and set CONTENT_FILE_PATH (and other path envs) on the server."
    );
  }
  const pagesFilePath =
    (q.pagesFilePath as string) ||
    process.env.PAGES_FILE_PATH ||
    "data/pages.json";
  const sectionsFilePath =
    (q.sectionsFilePath as string) ||
    process.env.SECTIONS_FILE_PATH ||
    "data/sections.json";

  return {
    owner,
    repo,
    branch,
    contentFilePath,
    productsFilePath,
    tailwindConfigPath,
    brandLogoPath,
    brandAltLogoPath,
    pagesFilePath,
    sectionsFilePath,
  };
}

function normalizeRepoPath(path: string) {
  const trimmed = path.trim();
  if (!trimmed) {
    return "";
  }

  const hadLeadingSlash = trimmed.startsWith("/");
  const withoutLeading = trimmed.replace(/^\/+/, "");

  if (!hadLeadingSlash) {
    return withoutLeading;
  }

  if (withoutLeading.startsWith("public/")) {
    return withoutLeading;
  }

  return `public/${withoutLeading}`;
}

function encodePathForRaw(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildRawFileUrl(
  path: string,
  sha: string | null | undefined,
  repoConfig?: {
    owner: string;
    repo: string;
    branch: string;
  }
) {
  const repoPath = normalizeRepoPath(path);
  if (!repoPath) {
    return "";
  }
  const encoded = encodePathForRaw(repoPath);
  const cacheBuster = sha ? sha.slice(0, 12) : Date.now().toString();
  
  // Use provided repo config or fallback to env vars
  const owner = repoConfig?.owner || CONTENT_REPO_OWNER || "";
  const repo = repoConfig?.repo || CONTENT_REPO_NAME || "";
  const branch = repoConfig?.branch || CONTENT_REPO_BRANCH || "main";
  
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encoded}?v=${cacheBuster}`;
}

function ensureLeadingSlash(path: string) {
  if (!path) {
    return "";
  }
  return path.startsWith("/") ? path : `/${path}`;
}

function websiteSrcToRepoPath(src: string) {
  if (!src) {
    return "";
  }
  const normalizedSrc = ensureLeadingSlash(src);
  if (normalizedSrc.startsWith("/public/")) {
    return normalizedSrc.replace(/^\//, "");
  }
  if (normalizedSrc.startsWith("/assets/")) {
    return `public${normalizedSrc}`;
  }
  if (normalizedSrc.startsWith("/")) {
    return `public${normalizedSrc}`;
  }
  if (normalizedSrc.startsWith("public/")) {
    return normalizedSrc;
  }
  return `public/${normalizedSrc.replace(/^\/+/, "")}`;
}

function repoPathToWebsitePath(path: string) {
  if (!path) {
    return "";
  }
  if (path.startsWith("public/")) {
    const withoutPublic = path.slice("public".length);
    return ensureLeadingSlash(withoutPublic);
  }
  return ensureLeadingSlash(path);
}

async function fetchContentJsonFromRepo(
  octokit: Awaited<ReturnType<typeof getAuthenticatedClient>>,
  repoConfig: {
    owner: string;
    repo: string;
    branch: string;
    contentFilePath: string;
  }
) {
  const response = await octokit.repos.getContent({
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    path: repoConfig.contentFilePath,
    ref: repoConfig.branch,
  });

  const fileData = response.data as GitHubFileResponse;

  if (!fileData.content || fileData.type !== "file") {
    throw new Error(
      `File not found or is not a file at path: ${repoConfig.contentFilePath}`
    );
  }

  const contentString = Buffer.from(fileData.content, "base64").toString("utf8");
  const parsed = JSON.parse(contentString);

  return {
    content: parsed,
    sha: fileData.sha,
  };
}

async function updateContentJsonInRepo({
  octokit,
  repoConfig,
  content,
  sha,
  commitMessage,
}: {
  octokit: Awaited<ReturnType<typeof getAuthenticatedClient>>;
  repoConfig: {
    owner: string;
    repo: string;
    branch: string;
    contentFilePath: string;
  };
  content: any;
  sha: string;
  commitMessage?: string;
}) {
  const contentString = JSON.stringify(content, null, 2);
  const base64 = Buffer.from(contentString, "utf8").toString("base64");

  const response = await octokit.repos.createOrUpdateFileContents({
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    path: repoConfig.contentFilePath,
    message:
      commitMessage ||
      `CMS: Automated content update for ${repoConfig.contentFilePath}`,
    content: base64,
    sha,
    branch: repoConfig.branch,
  });

  return {
    commitUrl: response.data.commit.html_url,
    newSha: response.data.content?.sha,
  };
}

function ensureTrustedByLogos(content: any) {
  if (!content.home) {
    content.home = {};
  }
  if (!content.home.trustedBy) {
    content.home.trustedBy = {};
  }
  if (!Array.isArray(content.home.trustedBy.logos)) {
    content.home.trustedBy.logos = [];
  }
  return content.home.trustedBy.logos as Array<{ src: string; alt?: string }>;
}

async function deleteFileFromRepo({
  octokit,
  path,
  sha,
  repoConfig,
  commitMessage,
}: {
  octokit: Awaited<ReturnType<typeof getAuthenticatedClient>>;
  path: string;
  sha: string;
  repoConfig: {
    owner: string;
    repo: string;
    branch: string;
  };
  commitMessage?: string;
}) {
  const repoPath = normalizeRepoPath(path);
  if (!repoPath) {
    throw new Error("Asset path cannot be empty.");
  }
  if (!sha) {
    throw new Error("SHA required to delete asset.");
  }

  await octokit.repos.deleteFile({
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    path: repoPath,
    message: commitMessage || `CMS: Delete asset ${repoPath}`,
    sha,
    branch: repoConfig.branch,
  });
}

async function fetchAssetMetadata(
  octokit: Awaited<ReturnType<typeof getAuthenticatedClient>>,
  path: string,
  repoConfig?: {
    owner: string;
    repo: string;
    branch: string;
  }
) {
  const repoPath = normalizeRepoPath(path);
  if (!repoPath) {
    return {};
  }

  // Use provided repo config or fallback to env vars
  const owner = repoConfig?.owner || CONTENT_REPO_OWNER || "";
  const repo = repoConfig?.repo || CONTENT_REPO_NAME || "";
  const branch = repoConfig?.branch || CONTENT_REPO_BRANCH || "main";

  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: repoPath,
      ref: branch,
    });

    const data = response.data as GitHubFileResponse;
    if (!data || data.type !== "file") {
      return {};
    }

    return {
      url: buildRawFileUrl(path, data.sha, { owner, repo, branch }),
      sha: data.sha,
    };
  } catch (error: any) {
    if (error?.status === 404) {
      return {};
    }
    console.error(`Error fetching asset metadata for ${path}:`, error);
    return {};
  }
}

const PRODUCTS_FILE_HEADER = `import type { Product } from "~/types/intake-form/checkout";

// --- PRODUCT DATA ---

// This is the master list of all available products.
`;

const PRODUCTS_FILE_FOOTER = `
export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function getPopularProducts(): Product[] {
  return products.filter((product) => product.popular);
}
`;

function extractProductsArray(content: string): Product[] {
  // First, try to find direct export: export const products: Product[] = [...]
  let arrayMatch = content.match(
    /export const products\s*:\s*Product\[\]\s*=\s*(\[[\s\S]*?\]);/
  );

  // If not found, try to find productsData array: const productsData: Product[] = [...]
  if (!arrayMatch || arrayMatch.length < 2) {
    arrayMatch = content.match(
      /const productsData\s*:\s*Product\[\]\s*=\s*(\[[\s\S]*?\]);/
    );
  }

  if (!arrayMatch || arrayMatch.length < 2) {
    throw new Error(
      "Unable to locate products array in products file content."
    );
  }

  const arrayLiteral = arrayMatch[1];

  try {
    const productArray = new Function(`"use strict"; return (${arrayLiteral});`)();
    return productArray as Product[];
  } catch (error) {
    console.error("Failed to parse products array literal:", error);
    throw new Error("Failed to parse products array from content file.");
  }
}

function formatProductsArray(products: Product[]): string {
  const json = JSON.stringify(products, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
}

function serializeProductsFile(products: Product[]): string {
  const formattedArray = formatProductsArray(products);
  return (
    `${PRODUCTS_FILE_HEADER}
export const products: Product[] = ${formattedArray};

${PRODUCTS_FILE_FOOTER}`.trimStart() + "\n"
  );
}

async function fetchProductsFromRepo(
  octokit: Awaited<ReturnType<typeof getAuthenticatedClient>>,
  repoConfig: {
    owner: string;
    repo: string;
    branch: string;
    productsFilePath: string;
  }
) {
  const response = await octokit.repos.getContent({
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    path: repoConfig.productsFilePath,
    ref: repoConfig.branch,
  });

  const fileData = response.data as GitHubFileResponse;

  if (!fileData.content || fileData.type !== "file") {
    throw new Error(
      `Products file not found or is not a file at path: ${repoConfig.productsFilePath}`
    );
  }

  const decodedContent = Buffer.from(fileData.content, "base64").toString(
    "utf8"
  );
  const products = extractProductsArray(decodedContent);

  const assetLookup: Record<string, { url?: string; sha?: string | null }> = {};

  const uniquePaths = Array.from(
    new Set(
      products
        .flatMap((product) => [product.img, product.thumbnail])
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );

  await Promise.all(
    uniquePaths.map(async (path) => {
      const repoPath = normalizeRepoPath(path);
      if (!repoPath) {
        assetLookup[path] = {};
        return;
      }

      try {
        const assetResponse = await octokit.repos.getContent({
          owner: repoConfig.owner,
          repo: repoConfig.repo,
          path: repoPath,
          ref: repoConfig.branch,
        });
        const assetData = assetResponse.data as GitHubFileResponse;
        if (assetData && assetData.type === "file") {
          assetLookup[path] = {
            url: buildRawFileUrl(path, assetData.sha, repoConfig),
            sha: assetData.sha,
          };
        } else {
          assetLookup[path] = {};
        }
      } catch (error: any) {
        if (error?.status === 404) {
          assetLookup[path] = {};
        } else {
          console.error(
            `Error fetching product asset at ${path}:`,
            error?.message || error
          );
          assetLookup[path] = {};
        }
      }
    })
  );

  return {
    products,
    sha: fileData.sha,
    assets: assetLookup,
  };
}

async function updateProductsInRepo({
  octokit,
  products,
  sha,
  commitMessage,
  repoConfig,
}: {
  octokit: Awaited<ReturnType<typeof getAuthenticatedClient>>;
  products: Product[];
  sha: string;
  commitMessage?: string;
  repoConfig: {
    owner: string;
    repo: string;
    branch: string;
    productsFilePath: string;
  };
}) {
  const fileContent = serializeProductsFile(products);
  const contentBase64 = Buffer.from(fileContent, "utf8").toString("base64");

  const response = await octokit.repos.createOrUpdateFileContents({
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    path: repoConfig.productsFilePath,
    message:
      commitMessage ||
      `CMS: Automated products update for ${repoConfig.productsFilePath}`,
    content: contentBase64,
    sha,
    branch: repoConfig.branch,
  });

  return {
    commitUrl: response.data.commit.html_url,
    newSha: response.data.content?.sha,
  };
}

async function fetchQuizConfigs(
  octokit: Awaited<ReturnType<typeof getAuthenticatedClient>>,
  repoConfig: {
    owner: string;
    repo: string;
    branch: string;
  }
): Promise<QuizSummary[]> {
  try {
    const response = await octokit.repos.getContent({
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      path: "data/intake-form/quizConfigs.ts",
      ref: repoConfig.branch,
    });

    const fileData = response.data as GitHubFileResponse;

    if (!fileData.content || fileData.type !== "file") {
      throw new Error(
        "Quiz configs not found or is not a file at path: data/intake-form/quizConfigs.ts"
      );
    }

    const decodedContent = Buffer.from(fileData.content, "base64").toString(
      "utf8"
    );

    const explicitConfigs: QuizSummary[] = [];
    const configRegex =
      /export const\s+[A-Za-z0-9_]+\s*:\s*QuizConfig\s*=\s*{[\s\S]*?id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?};/g;
    let match: RegExpExecArray | null;
    while ((match = configRegex.exec(decodedContent)) !== null) {
      const [, id, name] = match;
      explicitConfigs.push({ id, name });
    }

    if (explicitConfigs.length > 0) {
      return explicitConfigs;
    }

    const arrayMatch = decodedContent.match(
      /export const quizConfigs\s*=?\s*(?:[:=][^[]*)?(\[[\s\S]*?\])/
    );

    if (!arrayMatch || arrayMatch.length < 2) {
      return [];
    }

    const arrayLiteral = arrayMatch[1];

    try {
      const parsed = new Function(
        `"use strict"; return (${arrayLiteral});`
      )() as Array<{ id: string; name: string }>;

      return parsed
        .filter(
          (quiz) => typeof quiz?.id === "string" && typeof quiz?.name === "string"
        )
        .map((quiz) => ({
          id: quiz.id,
          name: quiz.name,
        }));
    } catch (error) {
      console.error("Failed to evaluate quizConfigs array:", error);
      return [];
    }
  } catch (error) {
    console.error("Error fetching quiz configs:", error);
    return [];
  }
}

type BrandingColors = {
  backgroundColor: string;
  bodyColor: string;
  accentColor1: string;
  accentColor2: string;
};

type QuizSummary = {
  id: string;
  name: string;
};

function extractBrandingColors(content: string): BrandingColors {
  // Default colors if parsing fails
  const defaults: BrandingColors = {
    backgroundColor: "#FFFFFF",
    bodyColor: "#000000",
    accentColor1: "#FF6B35",
    accentColor2: "#004E89",
  };

  // Try multiple patterns for each color
  const backgroundMatch = 
    content.match(/backgroundColor:\s*['"](#[A-Fa-f0-9]{3,8})['"]/) ||
    content.match(/backgroundColor:\s*(#[A-Fa-f0-9]{3,8})/);
  
  const bodyMatch = 
    content.match(/bodyColor:\s*['"](#[A-Fa-f0-9]{3,8})['"]/) ||
    content.match(/bodyColor:\s*(#[A-Fa-f0-9]{3,8})/);
  
  const accent1Match = 
    content.match(/accentColor1:\s*['"](#[A-Fa-f0-9]{3,8})['"]/) ||
    content.match(/DEFAULT:\s*['"](#[A-Fa-f0-9]{3,8})['"]/) ||
    content.match(/accentColor1:\s*(#[A-Fa-f0-9]{3,8})/);
  
  const accent2Match = 
    content.match(/accentColor2:\s*['"](#[A-Fa-f0-9]{3,8})['"]/) ||
    content.match(/--color-accentColor2,\s*(#[A-Fa-f0-9]{3,8})\)/) ||
    content.match(/accentColor2:\s*(#[A-Fa-f0-9]{3,8})/);

  const colors: BrandingColors = {
    backgroundColor: backgroundMatch?.[1] || defaults.backgroundColor,
    bodyColor: bodyMatch?.[1] || defaults.bodyColor,
    accentColor1: accent1Match?.[1] || defaults.accentColor1,
    accentColor2: accent2Match?.[1] || defaults.accentColor2,
  };

  // Log warnings for missing colors
  if (!backgroundMatch) {
    console.warn("⚠️  Could not parse backgroundColor from tailwind.config.js, using default");
  }
  if (!bodyMatch) {
    console.warn("⚠️  Could not parse bodyColor from tailwind.config.js, using default");
  }
  if (!accent1Match) {
    console.warn("⚠️  Could not parse accentColor1 from tailwind.config.js, using default");
  }
  if (!accent2Match) {
    console.warn("⚠️  Could not parse accentColor2 from tailwind.config.js, using default");
  }

  return colors;
}

function applyBrandingColors(
  content: string,
  colors: BrandingColors
): string {
  let updated = content;

  // Update backgroundColor - try multiple patterns
  // First try to match with quotes and hex color
  updated = updated.replace(
    /backgroundColor:\s*['"](#[A-Fa-f0-9]{3,8})['"]/g,
    `backgroundColor: '${colors.backgroundColor}'`
  );
  // Try to match any backgroundColor with a hex color (with quotes)
  updated = updated.replace(
    /backgroundColor:\s*'#[A-Fa-f0-9]{3,8}'/g,
    `backgroundColor: '${colors.backgroundColor}'`
  );
  updated = updated.replace(
    /backgroundColor:\s*"#[A-Fa-f0-9]{3,8}"/g,
    `backgroundColor: "${colors.backgroundColor}"`
  );
  // Try to match backgroundColor with any value (including CSS vars, etc.) and replace with new color
  updated = updated.replace(
    /backgroundColor:\s*'[^']*'/g,
    `backgroundColor: '${colors.backgroundColor}'`
  );
  updated = updated.replace(
    /backgroundColor:\s*"[^"]*"/g,
    `backgroundColor: "${colors.backgroundColor}"`
  );
  // Last resort: match backgroundColor: followed by any value until comma, newline, or closing brace
  updated = updated.replace(
    /(backgroundColor:\s*)(?:'[^']*'|"[^"]*"|var\([^)]+\)|[^,\n}]+)/g,
    `$1'${colors.backgroundColor}'`
  );

  // Update bodyColor - try multiple patterns
  // First try to match with quotes and hex color
  updated = updated.replace(
    /bodyColor:\s*['"](#[A-Fa-f0-9]{3,8})['"]/g,
    `bodyColor: '${colors.bodyColor}'`
  );
  // Try to match any bodyColor with a hex color (with quotes)
  updated = updated.replace(
    /bodyColor:\s*'#[A-Fa-f0-9]{3,8}'/g,
    `bodyColor: '${colors.bodyColor}'`
  );
  updated = updated.replace(
    /bodyColor:\s*"#[A-Fa-f0-9]{3,8}"/g,
    `bodyColor: "${colors.bodyColor}"`
  );
  // Try to match bodyColor with any value (including CSS vars, etc.) and replace with new color
  updated = updated.replace(
    /bodyColor:\s*'[^']*'/g,
    `bodyColor: '${colors.bodyColor}'`
  );
  updated = updated.replace(
    /bodyColor:\s*"[^"]*"/g,
    `bodyColor: "${colors.bodyColor}"`
  );
  // Last resort: match bodyColor: followed by any value until comma, newline, or closing brace
  updated = updated.replace(
    /(bodyColor:\s*)(?:'[^']*'|"[^"]*"|var\([^)]+\)|[^,\n}]+)/g,
    `$1'${colors.bodyColor}'`
  );

  // Update accentColor1 - try multiple patterns
  updated = updated.replace(
    /accentColor1:\s*['"](#[A-Fa-f0-9]{3,8})['"]/g,
    `accentColor1: '${colors.accentColor1}'`
  );
  updated = updated.replace(
    /DEFAULT:\s*['"](#[A-Fa-f0-9]{3,8})['"]/g,
    `DEFAULT: '${colors.accentColor1}'`
  );
  updated = updated.replace(
    /DEFAULT:\s*'#[^']+'/g,
    `DEFAULT: '${colors.accentColor1}'`
  );
  updated = updated.replace(
    /(--color-accentColor1,\s*)(#[A-Fa-f0-9]{3,8})(\))/g,
    `$1${colors.accentColor1}$3`
  );

  // Update accentColor2 - try multiple patterns
  updated = updated.replace(
    /accentColor2:\s*['"](#[A-Fa-f0-9]{3,8})['"]/g,
    `accentColor2: '${colors.accentColor2}'`
  );
  updated = updated.replace(
    /(--color-accentColor2,\s*)(#[A-Fa-f0-9]{3,8})(\))/g,
    `$1${colors.accentColor2}$3`
  );

  return updated;
}

async function fetchBrandingFromRepo(
  octokit: Awaited<ReturnType<typeof getAuthenticatedClient>>,
  repoConfig: {
    owner: string;
    repo: string;
    branch: string;
    tailwindConfigPath: string;
    brandLogoPath: string;
    brandAltLogoPath: string;
  }
) {
  const response = await octokit.repos.getContent({
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    path: repoConfig.tailwindConfigPath,
    ref: repoConfig.branch,
  });

  const fileData = response.data as GitHubFileResponse;

  if (!fileData.content || fileData.type !== "file") {
    throw new Error(
      `Tailwind config not found or is not a file at path: ${repoConfig.tailwindConfigPath}`
    );
  }

  const decodedContent = Buffer.from(fileData.content, "base64").toString(
    "utf8"
  );

  let colors: BrandingColors;
  try {
    colors = extractBrandingColors(decodedContent);
  } catch (error) {
    console.error("Error extracting branding colors:", error);
    // Use defaults if parsing fails
    colors = {
      backgroundColor: "#FFFFFF",
      bodyColor: "#000000",
      accentColor1: "#FF6B35",
      accentColor2: "#004E89",
    };
  }

  const [primaryLogo, secondaryLogo] = await Promise.all([
    fetchAssetMetadata(octokit, repoConfig.brandLogoPath, {
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      branch: repoConfig.branch,
    }),
    fetchAssetMetadata(octokit, repoConfig.brandAltLogoPath, {
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      branch: repoConfig.branch,
    }),
  ]);

  return {
    colors,
    sha: fileData.sha,
    logos: {
      primary: {
        path: repoConfig.brandLogoPath,
        ...(primaryLogo ?? {}),
      },
      secondary: {
        path: repoConfig.brandAltLogoPath,
        ...(secondaryLogo ?? {}),
      },
    },
  };
}

async function updateBrandingInRepo({
  octokit,
  colors,
  sha,
  commitMessage,
  repoConfig,
}: {
  octokit: Awaited<ReturnType<typeof getAuthenticatedClient>>;
  colors: BrandingColors;
  sha: string;
  commitMessage?: string;
  repoConfig: {
    owner: string;
    repo: string;
    branch: string;
    tailwindConfigPath: string;
  };
}) {
  const response = await octokit.repos.getContent({
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    path: repoConfig.tailwindConfigPath,
    ref: repoConfig.branch,
  });

  const fileData = response.data as GitHubFileResponse;

  if (!fileData.content || fileData.type !== "file") {
    throw new Error(
      `Tailwind config not found or is not a file at path: ${repoConfig.tailwindConfigPath}`
    );
  }

  const decodedContent = Buffer.from(fileData.content, "base64").toString(
    "utf8"
  );

  const updatedContent = applyBrandingColors(decodedContent, colors);

  const contentBase64 = Buffer.from(updatedContent, "utf8").toString("base64");

  const updateResponse = await octokit.repos.createOrUpdateFileContents({
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    path: repoConfig.tailwindConfigPath,
    message:
      commitMessage ||
      `CMS: Update branding colors in ${repoConfig.tailwindConfigPath}`,
    content: contentBase64,
    sha,
    branch: repoConfig.branch,
  });

  return {
    commitUrl: updateResponse.data.commit.html_url,
    newSha: updateResponse.data.content?.sha,
  };
}

app.get("/api/products", async (req: Request, res: Response) => {
  try {
    const repoConfig = getActiveRepoConfigFromRequest(req);
    const octokit = await getAuthenticatedClient();
    const { products, sha, assets } = await fetchProductsFromRepo(octokit, {
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      branch: repoConfig.branch,
      productsFilePath: repoConfig.productsFilePath,
    });

    res.json({
      products,
      sha,
      assets,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      error: `Failed to fetch products: ${(error as Error).message}`,
    });
  }
});

app.get("/api/quizzes", async (req: Request, res: Response) => {
  try {
    const repoConfig = getActiveRepoConfigFromRequest(req);
    const octokit = await getAuthenticatedClient();
    const quizzes = await fetchQuizConfigs(octokit, {
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      branch: repoConfig.branch,
    });
    res.json({ quizzes });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({
      error: "Failed to fetch quizzes.",
      quizzes: [],
    });
  }
});

interface ProductsUpdateRequest extends Request {
  body: {
    products: Product[];
    sha: string;
    commitMessage?: string;
    repoId?: string;
  };
}

interface ProductImageUploadRequest extends Request {
  body: {
    path: string;
    contentBase64: string;
    sha?: string;
    commitMessage?: string;
    deletePath?: string;
    deleteSha?: string;
    deleteCommitMessage?: string;
  };
}

interface BrandingUpdateRequest extends Request {
  body: {
    colors: BrandingColors;
    sha: string;
    commitMessage?: string;
    repoId?: string;
  };
}

interface ClientLogoCreateRequest extends Request {
  body: {
    fileName: string;
    alt?: string;
    contentBase64: string;
    commitMessage?: string;
  };
}

interface ClientLogoDeleteRequest extends Request {
  body: {
    src: string;
    commitMessage?: string;
  };
}

app.put(
  "/api/products",
  async (req: ProductsUpdateRequest, res: Response) => {
    try {
      const { products, sha, commitMessage, repoId } = req.body;
      const repoConfig = getActiveRepoConfigFromRequest(req);

      if (!Array.isArray(products) || !sha) {
        return res.status(400).json({
          error: "Request must include products array and current file sha.",
        });
      }

      const octokit = await getAuthenticatedClient();

      const { commitUrl, newSha } = await updateProductsInRepo({
        octokit,
        products,
        sha,
        commitMessage,
        repoConfig: {
          owner: repoConfig.owner,
          repo: repoConfig.repo,
          branch: repoConfig.branch,
          productsFilePath: repoConfig.productsFilePath,
        },
      });

      res.json({
        message: "Products updated successfully.",
        commitUrl,
        newSha,
      });
    } catch (error: any) {
      console.error("Error updating products:", error);
      if (error.status === 409) {
        return res.status(409).json({
          error:
            "Conflict detected. The products file has changed. Please refresh and retry.",
        });
      }

      res.status(500).json({
        error: `Failed to update products: ${(error as Error).message}`,
      });
    }
  }
);

app.get("/api/branding", async (req: Request, res: Response) => {
  try {
    const repoConfig = getActiveRepoConfigFromRequest(req);
    
    const octokit = await getAuthenticatedClient();
    const { colors, sha, logos } = await fetchBrandingFromRepo(octokit, {
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      branch: repoConfig.branch,
      tailwindConfigPath: repoConfig.tailwindConfigPath,
      brandLogoPath: repoConfig.brandLogoPath,
      brandAltLogoPath: repoConfig.brandAltLogoPath,
    });

    res.json({
      colors,
      sha,
      logos,
    });
  } catch (error) {
    console.error("Error fetching branding data:", error);
    console.error("Error stack:", (error as Error).stack);
    const errorMessage = (error as Error).message;
    
    // Provide more helpful error messages
    let userFriendlyError = errorMessage;
    if (errorMessage.includes("Repository configuration not found")) {
      userFriendlyError = `Repository not configured. Provide ?owner=&repo= or set env defaults.`;
    } else if (errorMessage.includes("Not Found") || errorMessage.includes("404")) {
      userFriendlyError = `File not found in repository. Please check:
        - Tailwind Config: ${TAILWIND_CONFIG_PATH}
        - Brand Logo: ${BRAND_PRIMARY_LOGO_PATH}
        - Brand Alt Logo: ${BRAND_SECONDARY_LOGO_PATH}
        - Ensure these files exist in the repository`;
    }
    
    res.status(500).json({
      error: `Failed to fetch branding data: ${userFriendlyError}`,
      details: errorMessage,
      repo: (req.query as any).owner && (req.query as any).repo ? { owner: (req.query as any).owner, repo: (req.query as any).repo } : null,
    });
  }
});

app.put("/api/branding", async (req: BrandingUpdateRequest, res: Response) => {
  try {
    const { colors, sha, commitMessage, repoId } = req.body;
    const repoConfig = getActiveRepoConfigFromRequest(req);

    if (!colors || typeof colors !== "object") {
      return res.status(400).json({
        error:
          "Request must include colors object with backgroundColor, bodyColor, accentColor1, and accentColor2.",
      });
    }

    const requiredKeys: Array<keyof BrandingColors> = [
      "backgroundColor",
      "bodyColor",
      "accentColor1",
      "accentColor2",
    ];

    for (const key of requiredKeys) {
      const value = colors[key];
      if (typeof value !== "string" || !value.trim()) {
        return res
          .status(400)
          .json({ error: `Missing or invalid color value for ${key}.` });
      }
    }

    if (!sha) {
      return res
        .status(400)
        .json({ error: "Request must include the current tailwind config sha." });
    }

    const octokit = await getAuthenticatedClient();

    const { commitUrl, newSha } = await updateBrandingInRepo({
      octokit,
      colors,
      sha,
      commitMessage,
      repoConfig: {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch: repoConfig.branch,
        tailwindConfigPath: repoConfig.tailwindConfigPath,
      },
    });

    // Fetch the updated colors from the file to return them
    const updatedResponse = await octokit.repos.getContent({
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      path: repoConfig.tailwindConfigPath,
      ref: repoConfig.branch,
    });
    
    const updatedFileData = updatedResponse.data as GitHubFileResponse;
    const updatedDecodedContent = updatedFileData.content ? Buffer.from(updatedFileData.content, "base64").toString("utf8") : "";
    const updatedColors = extractBrandingColors(updatedDecodedContent);

    res.json({
      message: "Branding colors updated successfully.",
      commitUrl,
      newSha,
      colors: updatedColors, // Return the updated colors
    });
  } catch (error: any) {
    console.error("Error updating branding data:", error);
    if (error.status === 409) {
      return res.status(409).json({
        error:
          "Conflict detected. The tailwind config has changed. Please refresh and retry.",
      });
    }

    res.status(500).json({
      error: `Failed to update branding data: ${(error as Error).message}`,
    });
  }
});

app.post(
  "/api/product-images",
  async (req: ProductImageUploadRequest, res: Response) => {
    try {
      const {
        path,
        contentBase64,
        sha,
        commitMessage,
        deletePath,
        deleteSha,
        deleteCommitMessage,
      } = req.body;
      const repoConfig = getActiveRepoConfigFromRequest(req);

      if (!path || typeof path !== "string" || !contentBase64) {
        return res.status(400).json({
          error: "Request must include path and contentBase64.",
        });
      }

      if (path.includes("..")) {
        return res.status(400).json({
          error: "Invalid path.",
        });
      }

      const repoPath = normalizeRepoPath(path);
      if (!repoPath) {
        return res.status(400).json({
          error: "Image path cannot be empty.",
        });
      }

      const octokit = await getAuthenticatedClient();

      // If SHA is not provided, try to fetch it from the existing file
      let fileSha = sha;
      if (!fileSha) {
        try {
          const metadata = await fetchAssetMetadata(
            octokit,
            repoPath,
            repoConfig
          );
          fileSha = metadata.sha || undefined;
        } catch (error: any) {
          // If file doesn't exist (404), that's fine - we'll create it
          // Otherwise, re-throw the error
          if (error?.status !== 404) {
            throw error;
          }
        }
      }

      const params: any = {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        path: repoPath,
        message:
          commitMessage ||
          `CMS: ${
            fileSha ? "Update" : "Create"
          } product image ${repoPath}`,
        content: contentBase64,
        branch: repoConfig.branch,
      };

      if (fileSha) {
        params.sha = fileSha;
      }

      const response = await octokit.repos.createOrUpdateFileContents(params);
      const newSha = response.data.content?.sha;
      const fileUrl = buildRawFileUrl(path, newSha ?? sha ?? null, {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch: repoConfig.branch,
      });

      let deletedPath: string | null = null;
      if (deletePath) {
        const normalizedDeletePath = normalizeRepoPath(deletePath);
        if (normalizedDeletePath && normalizedDeletePath !== repoPath) {
          if (!deleteSha) {
            return res.status(400).json({
              error: "deleteSha is required when deletePath is provided.",
            });
          }
          await deleteFileFromRepo({
            octokit,
            path: normalizedDeletePath,
            sha: deleteSha,
            repoConfig,
            commitMessage:
              deleteCommitMessage ||
              `CMS: Delete asset ${normalizedDeletePath}`,
          });
          deletedPath = normalizedDeletePath;
        }
      }

      res.json({
        message: sha
          ? "Image updated successfully."
          : "Image created successfully.",
        newSha,
        commitUrl: response.data.commit.html_url,
        fileUrl,
        deletedPath,
      });
    } catch (error: any) {
      console.error("Error uploading product image:", error);
      if (error?.status === 409) {
        return res.status(409).json({
          error:
            "Conflict detected. The image changed in the repository. Refresh and try again.",
        });
      }

      res.status(500).json({
        error: `Failed to upload product image: ${(error as Error).message}`,
      });
    }
  }
);

interface AssetDefinition {
  path: string;
  label: string;
  category: "brand" | "before-after" | "client-logo";
  websiteSrc?: string;
}

const BRAND_ASSETS: AssetDefinition[] = [
  {
    path: "public/assets/images/brand/hero-bg.png",
    label: "Hero Background",
    category: "brand",
  },
  {
    path: "public/assets/images/brand/hero-img.png",
    label: "Hero Image",
    category: "brand",
  },
  {
    path: "public/assets/images/brand/logo.svg",
    label: "Primary Logo",
    category: "brand",
  },
  {
    path: "public/assets/images/brand/logo-alt.svg",
    label: "Alternate Logo",
    category: "brand",
  },
];

const BEFORE_AFTER_ASSETS: AssetDefinition[] = Array.from(
  { length: 4 },
  (_, index) => ({
    path: `public/assets/images/before-after-${index + 1}.png`,
    label: `Before & After ${index + 1}`,
    category: "before-after",
  })
);

const CLIENT_LOGO_ASSETS: AssetDefinition[] = [
  {
    path: "public/assets/images/clients/schweiger.png",
    label: "Schweiger Dermatology Group",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/echelon.png",
    label: "Echelon Fitness",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/yesyoucan.png",
    label: "Yes You Can",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/dietdirect.png",
    label: "Diet Direct",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/alpha.png",
    label: "Alpha",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/fifty410.png",
    label: "Fifty 410",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/skinclique.png",
    label: "Skin Clique",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/medvi.png",
    label: "Medvi",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/bloomberg.png",
    label: "Bloomberg",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/forbes.png",
    label: "Forbes",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/healthline.png",
    label: "Healthline",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/web-md.png",
    label: "WebMD",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/fortune.png",
    label: "Fortune",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/fast-company.png",
    label: "Fast Company",
    category: "client-logo",
  },
  {
    path: "public/assets/images/clients/new-york-times.png",
    label: "The New York Times",
    category: "client-logo",
  },
];

const MANAGED_ASSETS = [...BRAND_ASSETS, ...BEFORE_AFTER_ASSETS];

async function buildClientLogoAssets({
  octokit,
  repoConfig,
}: {
  octokit: Awaited<ReturnType<typeof getAuthenticatedClient>>;
  repoConfig: {
    owner: string;
    repo: string;
    branch: string;
    contentFilePath: string;
  };
}) {
  try {
    const { content } = await fetchContentJsonFromRepo(octokit, {
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      branch: repoConfig.branch,
      contentFilePath: repoConfig.contentFilePath,
    });
    const logos = content?.home?.trustedBy?.logos;
    if (!Array.isArray(logos)) {
      return CLIENT_LOGO_ASSETS;
    }
    return logos
      .map<AssetDefinition | null>((logo: any, index: number) => {
        const src = typeof logo?.src === "string" ? logo.src : "";
        const repoPath = websiteSrcToRepoPath(src);
        if (!repoPath) {
          return null;
        }
        return {
          path: repoPath,
          label:
            typeof logo?.alt === "string" && logo.alt.trim().length > 0
              ? logo.alt.trim()
              : `Client Logo ${index + 1}`,
          category: "client-logo" as const,
          websiteSrc: ensureLeadingSlash(src),
        };
      })
      .filter((item): item is AssetDefinition => Boolean(item));
  } catch (error) {
    console.error("Error building client logo assets:", error);
    return CLIENT_LOGO_ASSETS;
  }
}

// ============================================================================
// REPOSITORY MANAGEMENT ENDPOINTS
// ============================================================================

// Helper function to extract repoId from path
// Express regex routes capture groups in req.params array
// We need to handle URL-encoded repoIds (frontend encodes slashes)
function extractRepoIdFromPath(req: Request, suffix?: string): string {
  let repoId = "";
  
  // Express regex routes store captured groups in req.params array
  // For route /^\/api\/repositories\/(.+)\/test$/, the capture group is in params[0]
  const params = req.params as any;
  if (params && Array.isArray(params) && params.length > 0) {
    repoId = params[0] || "";
  } else if (params && typeof params === 'object') {
    // Try different ways to access the capture group
    repoId = params[0] || params['0'] || "";
  }
  
  // Fallback: parse from the full path
  if (!repoId) {
    let pathPart = req.path.replace("/api/repositories/", "");
    if (suffix && pathPart.endsWith(suffix)) {
      pathPart = pathPart.slice(0, -suffix.length);
    }
    repoId = pathPart;
  } else {
    // If we got it from params, remove suffix if present
    if (suffix && repoId.endsWith(suffix)) {
      repoId = repoId.slice(0, -suffix.length);
    }
  }
  
  // Decode URL-encoded repoId (handles slashes like owner/repo)
  // The frontend encodes it, so we decode it here
  try {
    return decodeURIComponent(repoId);
  } catch (e) {
    // If decoding fails, return as-is (might already be decoded)
    return repoId;
  }
}


// GET /api/repositories - List all available repositories
app.get("/api/repositories", async (_req: Request, res: Response) => {
  try {
    const availableRepos = await fetchAvailableRepos();
    const configuredRepos = getAllRepoConfigs();
    const configuredRepoIds = new Set(configuredRepos.map((r) => r.id));


    // Merge available repos with configuration status
    const reposWithStatus = availableRepos.map((repo) => {
      const config = configuredRepos.find((c) => c.id === repo.id);
      return {
        ...repo,
        isConfigured: configuredRepoIds.has(repo.id),
        config: config || null,
      };
    });

    res.json({
      repositories: reposWithStatus,
      configured: configuredRepos,
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    res.status(500).json({
      error: `Failed to fetch repositories: ${(error as Error).message}`,
    });
  }
});

// IMPORTANT: Routes with specific suffixes must come BEFORE wildcard routes
// POST /api/repositories/:repoId/configure - Save repository configuration
// Handle repoId with slashes by URL encoding (frontend encodes, backend decodes)
// Use regex route to match any characters including URL-encoded slashes
app.post(
  /^\/api\/repositories\/(.+)\/configure$/,
  async (req: Request, res: Response) => {
    try {
      // Extract repoId from regex match (req.params[0] contains the first capture group)
      const match = req.path.match(/^\/api\/repositories\/(.+)\/configure$/);
      if (!match || !match[1]) {
        return res.status(400).json({ error: "Invalid repository ID in path" });
      }
      let repoId = match[1];
      try {
        repoId = decodeURIComponent(repoId);
      } catch (e) {
        // If decoding fails, use as-is
      }
      const config: Partial<RepoConfig> = req.body;

      // Validate required fields
      if (!config.owner || !config.repo || !config.defaultBranch) {
        return res.status(400).json({
          error: "Missing required fields: owner, repo, defaultBranch",
        });
      }

      // Ensure repoId matches
      if (config.id && config.id !== repoId) {
        return res.status(400).json({
          error: "Repository ID mismatch",
        });
      }

      const fullConfig: RepoConfig = {
        id: repoId,
        owner: config.owner,
        repo: config.repo,
        defaultBranch: config.defaultBranch,
        displayName: config.displayName || config.repo,
        contentFilePath:
          config.contentFilePath || "data/content.json",
        productsFilePath:
          config.productsFilePath || "data/intake-form/products.ts",
        tailwindConfigPath:
          config.tailwindConfigPath || "tailwind.config.js",
        brandLogoPath:
          config.brandLogoPath ||
          "public/assets/images/brand/logo.svg",
        brandAltLogoPath:
          config.brandAltLogoPath ||
          "public/assets/images/brand/logo-alt.svg",
        isConfigured: true,
        createdAt: config.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      };

      saveRepoConfig(fullConfig);
      
      res.json({
        message: "Repository configuration saved successfully",
        config: fullConfig,
      });
    } catch (error) {
      console.error("Error saving repository config:", error);
      res.status(500).json({
        error: `Failed to save repository config: ${(error as Error).message}`,
      });
    }
  }
);

// POST /api/repositories/:repoId/test - Test repository connection and validate paths
// Handle repoId with slashes by URL encoding (frontend encodes, backend decodes)
// Can work with unconfigured repos by accepting owner/repo/branch in request body
// Use regex route to match any characters including URL-encoded slashes
app.post(
  /^\/api\/repositories\/(.+)\/test$/,
  async (req: Request, res: Response) => {
    try {
      // Extract repoId from regex match (req.params[0] contains the first capture group)
      const match = req.path.match(/^\/api\/repositories\/(.+)\/test$/);
      if (!match || !match[1]) {
        return res.status(400).json({ error: "Invalid repository ID in path" });
      }
      let repoId = match[1];
      try {
        repoId = decodeURIComponent(repoId);
      } catch (e) {
        // If decoding fails, use as-is
      }
      
      const { paths, owner, repo, branch } = req.body;
      
      if (!paths) {
        return res.status(400).json({
          error: "Missing paths in request body",
        });
      }

      // Try to get config, but allow testing unconfigured repos
      let ownerToUse: string;
      let repoToUse: string;
      let branchToUse: string;

      const config = getRepoConfig(repoId);
      if (config) {
        // Use configured values
        ownerToUse = config.owner;
        repoToUse = config.repo;
        branchToUse = config.defaultBranch;
      } else if (owner && repo && branch) {
        // Use values from request body (for unconfigured repos)
        ownerToUse = owner;
        repoToUse = repo;
        branchToUse = branch;
      } else {
        return res.status(400).json({
          error: "Repository not configured. Please provide owner, repo, and branch in request body.",
        });
      }

      const validationResults = await validateRepoPaths(
        ownerToUse,
        repoToUse,
        branchToUse,
        paths
      );

      const allValid = validationResults.every((r) => r.exists);
      const status = allValid ? "success" : "error";

      res.json({
        status,
        results: validationResults,
        message: allValid
          ? "All paths are valid"
          : "Some paths are invalid or not found",
      });
    } catch (error) {
      console.error("Error testing repository connection:", error);
      res.status(500).json({
        error: `Failed to test repository connection: ${(error as Error).message}`,
      });
    }
  }
);

// GET /api/repositories/:repoId - Get specific repository configuration
// Handle repoId with slashes by URL encoding (frontend encodes, backend decodes)
// Must come AFTER specific routes (/configure, /test)
// Use regex route to match any characters including URL-encoded slashes
app.get(
  /^\/api\/repositories\/(.+)$/,
  async (req: Request, res: Response) => {
    try {
    // Skip if this is a sub-route (configure, test) - these have their own handlers
    if (req.path.includes("/configure") || req.path.includes("/test")) {
      return res.status(404).json({ error: "Not found" });
    }
    
    // Extract repoId from regex match
    const match = req.path.match(/^\/api\/repositories\/(.+)$/);
    if (!match || !match[1]) {
      return res.status(400).json({ error: "Invalid repository ID in path" });
    }
    let repoId = match[1];
    try {
      repoId = decodeURIComponent(repoId);
    } catch (e) {
      // If decoding fails, use as-is
    }
    const config = getRepoConfig(repoId);

    if (!config) {
      return res.status(404).json({
        error: `Repository configuration not found: ${repoId}`,
      });
    }

    res.json(config);
  } catch (error) {
    console.error("Error fetching repository config:", error);
    res.status(500).json({
      error: `Failed to fetch repository config: ${(error as Error).message}`,
    });
  }
});

// DELETE /api/repositories/:repoId - Delete repository configuration
// Handle repoId with slashes by URL encoding (frontend encodes, backend decodes)
// Must come AFTER specific routes (/configure, /test)
// Use regex route to match any characters including URL-encoded slashes
app.delete(
  /^\/api\/repositories\/(.+)$/,
  async (req: Request, res: Response) => {
    try {
    // Skip if this is a sub-route (configure, test)
    if (req.path.includes("/configure") || req.path.includes("/test")) {
      return res.status(404).json({ error: "Not found" });
    }
    
    // Extract repoId from regex match
    const match = req.path.match(/^\/api\/repositories\/(.+)$/);
    if (!match || !match[1]) {
      return res.status(400).json({ error: "Invalid repository ID in path" });
    }
    let repoId = match[1];
    try {
      repoId = decodeURIComponent(repoId);
    } catch (e) {
      // If decoding fails, use as-is
    }
    const deleted = deleteRepoConfig(repoId);

    if (!deleted) {
      return res.status(404).json({
        error: `Repository configuration not found: ${repoId}`,
      });
    }

    res.json({
      message: "Repository configuration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting repository config:", error);
    res.status(500).json({
      error: `Failed to delete repository config: ${(error as Error).message}`,
    });
  }
});

// ============================================================================
// CONTENT ENDPOINTS (Updated to support repoId)
// ============================================================================

// --- READ Endpoint ---
app.get("/api/content", async (req: Request, res: Response) => {
  try {
    const repoConfig = getActiveRepoConfigFromRequest(req)
    const octokit = await getAuthenticatedClient()
    const response = await octokit.repos.getContent({
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      path: repoConfig.contentFilePath,
      ref: repoConfig.branch,
    })

    const fileData = response.data as GitHubFileResponse

    if (!fileData.content || fileData.type !== "file") {
      throw new Error(
        `File not found or is a directory at path: ${repoConfig.contentFilePath}`
      )
    }

    const contentBase64 = fileData.content
    const contentSha = fileData.sha

    const contentString = Buffer.from(contentBase64, "base64").toString("utf8")
    const contentJson = JSON.parse(contentString)

    const responseData: DashboardContentData = {
      content: contentJson,
      sha: contentSha,
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error("Error fetching content:", error)
    const q: any = req.query || {}
    res.status(500).json({
      error: `Failed to fetch content.`,
      details: (error as Error).message,
      repo: (q.owner ?? q["repo-owner"] ?? q.repoOwner) && (q.repo ?? q["repo-name"] ?? q.repoName) ? { owner: q.owner ?? q["repo-owner"] ?? q.repoOwner, repo: q.repo ?? q["repo-name"] ?? q.repoName } : null,
    })
  }
})

// --- DEFINE THE BODY FOR THE UPDATE REQUEST ---
interface ContentUpdateRequest extends Request {
  body: {
    newContent: any;
    sha: string;
  };
}

// --- WRITE Endpoint (Full Implementation) ---
app.post(
  "/api/content/update",
  async (req: ContentUpdateRequest, res: Response) => {
    try {
      const { newContent, sha } = req.body

      if (!newContent || !sha) {
        return res
          .status(400)
          .json({ error: "Missing new content or SHA in request body." })
      }

      const repoConfig = getActiveRepoConfigFromRequest(req)
      const octokit = await getAuthenticatedClient()
      const contentString = JSON.stringify(newContent, null, 2)
      const contentBase64 = Buffer.from(contentString, "utf8").toString(
        "base64"
      )

      const commitResponse = await octokit.repos.createOrUpdateFileContents({
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        path: repoConfig.contentFilePath,
        message: `CMS: Automated content update for ${repoConfig.contentFilePath}`,
        content: contentBase64,
        sha: sha,
        branch: repoConfig.branch,
      })

      res.status(200).json({
        message: "Content committed successfully. Deployment initiated.",
        commitUrl: commitResponse.data.commit.html_url,
        newSha: commitResponse.data.content?.sha,
      })
    } catch (error: any) {
      console.error("Error updating content:", error.message)

      let errorMessage = "Failed to commit changes to GitHub."
      if (error.status === 409) {
        errorMessage =
          "Conflict error (409): The file was modified by someone else. Please refresh and try again."
      }

      res.status(500).json({
        error: errorMessage,
        details: error.message,
      })
    }
  }
)

// ============================================================================
// PAGES ENDPOINTS
// ============================================================================

// GET /api/pages - Fetch Pages.json
app.get("/api/pages", async (req: Request, res: Response) => {
  try {
    const repoConfig = getActiveRepoConfigFromRequest(req)
    const octokit = await getAuthenticatedClient()
    const response = await octokit.repos.getContent({
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      path: repoConfig.pagesFilePath,
      ref: repoConfig.branch,
    })

    const fileData = response.data as GitHubFileResponse

    if (!fileData.content || fileData.type !== "file") {
      throw new Error(
        `File not found or is a directory at path: ${repoConfig.pagesFilePath}`
      )
    }

    const contentString = Buffer.from(fileData.content, "base64").toString("utf8")
    const pagesJson = JSON.parse(contentString)

    res.status(200).json({
      pages: pagesJson,
      sha: fileData.sha,
    })
  } catch (error) {
    console.error("Error fetching pages:", error)
    const q: any = req.query || {}
    res.status(500).json({
      error: `Failed to fetch pages.`,
      details: (error as Error).message,
      repo: (q.owner ?? q["repo-owner"] ?? q.repoOwner) && (q.repo ?? q["repo-name"] ?? q.repoName) ? { owner: q.owner ?? q["repo-owner"] ?? q.repoOwner, repo: q.repo ?? q["repo-name"] ?? q.repoName } : null,
    })
  }
})

// POST /api/pages - Update Pages.json
interface PagesUpdateRequest extends Request {
  body: {
    pages: any;
    sha: string;
  };
}

app.post("/api/pages", async (req: PagesUpdateRequest, res: Response) => {
  try {
    const { pages, sha } = req.body

    if (!pages || !sha) {
      return res
        .status(400)
        .json({ error: "Missing pages data or SHA in request body." })
    }

    const repoConfig = getActiveRepoConfigFromRequest(req)
    const octokit = await getAuthenticatedClient()
    const contentString = JSON.stringify(pages, null, 2)
    const contentBase64 = Buffer.from(contentString, "utf8").toString("base64")

    const commitResponse = await octokit.repos.createOrUpdateFileContents({
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      path: repoConfig.pagesFilePath,
      message: `CMS: Automated pages update for ${repoConfig.pagesFilePath}`,
      content: contentBase64,
      sha: sha,
      branch: repoConfig.branch,
    })

    res.status(200).json({
      message: "Pages committed successfully.",
      commitUrl: commitResponse.data.commit.html_url,
      sha: commitResponse.data.content?.sha,
      pages: pages,
    })
  } catch (error: any) {
    console.error("Error updating pages:", error.message)

    let errorMessage = "Failed to commit pages to GitHub."
    if (error.status === 409) {
      errorMessage =
        "Conflict error (409): The file was modified by someone else. Please refresh and try again."
    }

    res.status(500).json({
      error: errorMessage,
      details: error.message,
    })
  }
})

// ============================================================================
// SECTIONS ENDPOINTS
// ============================================================================

// GET /api/sections - Fetch Sections.json
app.get("/api/sections", async (req: Request, res: Response) => {
  try {
    const repoConfig = getActiveRepoConfigFromRequest(req)
    const octokit = await getAuthenticatedClient()
    const response = await octokit.repos.getContent({
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      path: repoConfig.sectionsFilePath,
      ref: repoConfig.branch,
    })

    const fileData = response.data as GitHubFileResponse

    if (!fileData.content || fileData.type !== "file") {
      throw new Error(
        `File not found or is a directory at path: ${repoConfig.sectionsFilePath}`
      )
    }

    const contentString = Buffer.from(fileData.content, "base64").toString("utf8")
    const sectionsJson = JSON.parse(contentString)

    res.status(200).json({
      sections: sectionsJson,
      sha: fileData.sha,
    })
  } catch (error) {
    console.error("Error fetching sections:", error)
    const q: any = req.query || {}
    res.status(500).json({
      error: `Failed to fetch sections.`,
      details: (error as Error).message,
      repo: (q.owner ?? q["repo-owner"] ?? q.repoOwner) && (q.repo ?? q["repo-name"] ?? q.repoName) ? { owner: q.owner ?? q["repo-owner"] ?? q.repoOwner, repo: q.repo ?? q["repo-name"] ?? q.repoName } : null,
    })
  }
})

// POST /api/sections - Update Sections.json
interface SectionsUpdateRequest extends Request {
  body: {
    sections: any;
    sha: string;
  };
}

app.post("/api/sections", async (req: SectionsUpdateRequest, res: Response) => {
  try {
    const { sections, sha } = req.body

    if (!sections || !sha) {
      return res
        .status(400)
        .json({ error: "Missing sections data or SHA in request body." })
    }

    const repoConfig = getActiveRepoConfigFromRequest(req)
    const octokit = await getAuthenticatedClient()
    const contentString = JSON.stringify(sections, null, 2)
    const contentBase64 = Buffer.from(contentString, "utf8").toString("base64")

    const commitResponse = await octokit.repos.createOrUpdateFileContents({
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      path: repoConfig.sectionsFilePath,
      message: `CMS: Automated sections update for ${repoConfig.sectionsFilePath}`,
      content: contentBase64,
      sha: sha,
      branch: repoConfig.branch,
    })

    res.status(200).json({
      message: "Sections committed successfully.",
      commitUrl: commitResponse.data.commit.html_url,
      sha: commitResponse.data.content?.sha,
      sections: sections,
    })
  } catch (error: any) {
    console.error("Error updating sections:", error.message)

    let errorMessage = "Failed to commit sections to GitHub."
    if (error.status === 409) {
      errorMessage =
        "Conflict error (409): The file was modified by someone else. Please refresh and try again."
    }

    res.status(500).json({
      error: errorMessage,
      details: error.message,
    })
  }
})

app.get("/api/assets", async (req: Request, res: Response) => {
  try {
    const repoConfig = getActiveRepoConfigFromRequest(req)
    const octokit = await getAuthenticatedClient()
    const clientLogoAssets = await buildClientLogoAssets({
      octokit,
      repoConfig: {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch: repoConfig.branch,
        contentFilePath: repoConfig.contentFilePath,
      },
    })
    const managedAssets = [...MANAGED_ASSETS, ...clientLogoAssets]
    const assets = await Promise.all(
      managedAssets.map(async (asset) => {
        try {
          const response = await octokit.repos.getContent({
            owner: repoConfig.owner,
            repo: repoConfig.repo,
            path: asset.path,
            ref: repoConfig.branch,
          })
          const data = response.data as GitHubFileResponse & {
            download_url?: string
          }
          
          if (!data.sha) {
            // File exists but no SHA - return with empty URL
            return {
              ...asset,
              sha: "",
              url: "",
              websiteSrc: asset.websiteSrc || repoPathToWebsitePath(asset.path),
            }
          }
          
          // Construct the raw GitHub URL for the image
          const imageUrl = buildRawFileUrl(asset.path, data.sha, {
            owner: repoConfig.owner,
            repo: repoConfig.repo,
            branch: repoConfig.branch,
          })
          
          return {
            ...asset,
            sha: data.sha,
            url: imageUrl,
            websiteSrc: asset.websiteSrc || repoPathToWebsitePath(asset.path),
          }
        } catch (fileError: any) {
          // File doesn't exist yet - return with empty values so user can upload
          if (fileError.status === 404 || fileError.message?.includes("Not Found")) {
            return {
              ...asset,
              sha: "", // Empty SHA means file doesn't exist - will be created on upload
              url: "", // No URL since file doesn't exist
              websiteSrc: asset.websiteSrc || repoPathToWebsitePath(asset.path),
            }
          }
          // Re-throw other errors
          throw fileError
        }
      })
    )
    res.json({ assets })
  } catch (error) {
    console.error("Error fetching assets:", error)
    res.status(500).json({
      error: `Failed to fetch assets: ${(error as Error).message}`,
    })
  }
})

app.get("/api/directory/list", async (req: Request, res: Response) => {
  try {
    const { path } = req.query
    const repoConfig = getActiveRepoConfigFromRequest(req)

    if (!path || typeof path !== "string") {
      return res.status(400).json({
        error: "Missing path query parameter.",
      })
    }

    const octokit = await getAuthenticatedClient()

    try {
      const response = await octokit.repos.getContent({
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        path: path,
        ref: repoConfig.branch,
      })

      const data = response.data

      // If it's a file, return empty array
      if (!Array.isArray(data)) {
        return res.json({ files: [] })
      }

      // Return array of file names
      const files = data
        .filter((item: any) => item.type === "file")
        .map((item: any) => item.name)

      res.json({ files })
    } catch (error: any) {
      if (error?.status === 404) {
        // Directory doesn't exist - return empty array
        return res.json({ files: [] })
      }
      throw error
    }
  } catch (error) {
    console.error("Error listing directory:", error)
    res.status(500).json({
      error: `Failed to list directory: ${(error as Error).message}`,
    })
  }
})

interface AssetUpdateRequest extends Request {
  body: {
    path: string;
    contentBase64: string;
    sha: string;
    repoId?: string;
  };
}

app.post(
  "/api/assets/update",
  async (req: AssetUpdateRequest, res: Response) => {
    try {
      const { path, contentBase64, sha } = req.body
      const repoConfig = getActiveRepoConfigFromRequest(req)

      if (!path || !contentBase64) {
        return res.status(400).json({
          error: "Missing path or contentBase64 in request body.",
        })
      }

      const asset =
        MANAGED_ASSETS.find((item) => item.path === path) ||
        (path.startsWith("public/assets/images/clients/")
          ? {
              path,
              label: path.split("/").pop() || "Client Logo",
              category: "client-logo" as const,
            }
          : null)
      if (!asset) {
        return res.status(400).json({ error: "Unsupported asset path." })
      }

      const octokit = await getAuthenticatedClient()
      
      // If sha is empty, we're creating a new file (don't include sha parameter)
      // If sha exists, we're updating an existing file (include sha parameter)
      const updateParams: any = {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        path,
        message: sha ? `CMS: Asset update for ${path}` : `CMS: Create new asset ${path}`,
        content: contentBase64,
        branch: repoConfig.branch,
      }
      
      // Only include sha if it's not empty (for updating existing files)
      if (sha) {
        updateParams.sha = sha
      }

      const commitResponse = await octokit.repos.createOrUpdateFileContents(updateParams)

      const newSha = commitResponse.data.content?.sha
      const fileUrl = buildRawFileUrl(path, newSha, {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch: repoConfig.branch,
      })

      res.json({
        message: sha ? "Asset updated successfully." : "Asset created successfully.",
        newSha,
        commitUrl: commitResponse.data.commit.html_url,
        fileUrl,
      })
    } catch (error) {
      console.error("Error updating asset:", error)
      res.status(500).json({
        error: `Failed to update asset: ${(error as Error).message}`,
      })
    }
  }
)

app.post(
  "/api/client-logos",
  async (req: ClientLogoCreateRequest, res: Response) => {
    try {
      const { fileName, alt, contentBase64, commitMessage } = req.body
      if (
        !fileName ||
        typeof fileName !== "string" ||
        !contentBase64 ||
        typeof contentBase64 !== "string"
      ) {
        return res.status(400).json({
          error: "Missing fileName or contentBase64 in request body.",
        })
      }

      const trimmedFileName = fileName.trim()
      if (
        !trimmedFileName ||
        trimmedFileName.includes("..") ||
        trimmedFileName.includes("/") ||
        trimmedFileName.includes("\\")
      ) {
        return res.status(400).json({
          error: "Invalid file name provided.",
        })
      }

      if (!/\.[A-Za-z0-9]+$/.test(trimmedFileName)) {
        return res.status(400).json({
          error: "File name must include an extension (e.g., logo.png).",
        })
      }

      const repoConfig = getActiveRepoConfigFromRequest(req)
      const octokit = await getAuthenticatedClient()
      const assetPath = normalizeRepoPath(
        `public/assets/images/clients/${trimmedFileName}`
      )
      const websiteSrc = repoPathToWebsitePath(assetPath)

      const uploadResponse = await octokit.repos.createOrUpdateFileContents({
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        path: assetPath,
        message:
          commitMessage || `CMS: Add client logo ${trimmedFileName}`,
        content: contentBase64,
        branch: repoConfig.branch,
      })

      const fileSha = uploadResponse.data.content?.sha || ""
      const fileUrl = buildRawFileUrl(assetPath, fileSha, {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch: repoConfig.branch,
      })

      const { content, sha } = await fetchContentJsonFromRepo(octokit, {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch: repoConfig.branch,
        contentFilePath: repoConfig.contentFilePath,
      })

      const logos = ensureTrustedByLogos(content)

      if (logos.some((logo) => logo?.src === websiteSrc)) {
        return res.status(409).json({
          error: "A client logo with that path already exists.",
        })
      }

      const derivedAlt =
        alt?.trim() ||
        trimmedFileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim() ||
        "Client Logo"

      const newLogo = {
        src: websiteSrc,
        alt: derivedAlt,
      }

      logos.push(newLogo)

      const { commitUrl: contentCommitUrl, newSha: newContentSha } =
        await updateContentJsonInRepo({
          octokit,
          repoConfig: {
            owner: repoConfig.owner,
            repo: repoConfig.repo,
            branch: repoConfig.branch,
            contentFilePath: repoConfig.contentFilePath,
          },
          content,
          sha,
          commitMessage: "CMS: Register client logo in website content",
        })

      res.json({
        message: "Client logo created successfully.",
        logo: newLogo,
        logos,
        fileUrl,
        assetSha: fileSha,
        assetCommitUrl: uploadResponse.data.commit.html_url,
        contentSha: newContentSha,
        contentCommitUrl,
      })
    } catch (error: any) {
      console.error("Error creating client logo:", error)
      if (error.status === 409) {
        return res.status(409).json({
          error:
            "Conflict detected while creating the logo. Please refresh and try again.",
        })
      }
      res.status(500).json({
        error: `Failed to create client logo: ${(error as Error).message}`,
      })
    }
  }
)

app.delete(
  "/api/client-logos",
  async (req: ClientLogoDeleteRequest, res: Response) => {
    try {
      const { src, commitMessage } = req.body
      if (!src || typeof src !== "string") {
        return res.status(400).json({
          error: "Missing logo src in request body.",
        })
      }

      const normalizedSrc = ensureLeadingSlash(src.trim())
      const assetPath = websiteSrcToRepoPath(normalizedSrc)
      if (!assetPath) {
        return res.status(400).json({
          error: "Unable to resolve asset path for the provided logo.",
        })
      }

      const repoConfig = getActiveRepoConfigFromRequest(req)
      const octokit = await getAuthenticatedClient()

      const { content, sha } = await fetchContentJsonFromRepo(octokit, {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch: repoConfig.branch,
        contentFilePath: repoConfig.contentFilePath,
      })

      const logos = ensureTrustedByLogos(content)
      const filteredLogos = logos.filter((logo) => logo?.src !== normalizedSrc)

      if (filteredLogos.length === logos.length) {
        return res.status(404).json({
          error: "Client logo not found in website content.",
        })
      }

      content.home.trustedBy.logos = filteredLogos

      const { commitUrl: contentCommitUrl, newSha: newContentSha } =
        await updateContentJsonInRepo({
          octokit,
          repoConfig: {
            owner: repoConfig.owner,
            repo: repoConfig.repo,
            branch: repoConfig.branch,
            contentFilePath: repoConfig.contentFilePath,
          },
          content,
          sha,
          commitMessage: "CMS: Remove client logo from website content",
        })

      try {
        const metadata = await fetchAssetMetadata(
          octokit,
          assetPath,
          repoConfig
        )
        if (metadata?.sha) {
          await deleteFileFromRepo({
            octokit,
            path: assetPath,
            sha: metadata.sha,
            repoConfig,
            commitMessage:
              commitMessage ||
              `CMS: Delete client logo ${normalizedSrc}`,
          })
        }
      } catch (assetError) {
        console.error("Failed to delete client logo asset:", assetError)
      }

      res.json({
        message: "Client logo deleted successfully.",
        logos: filteredLogos,
        contentSha: newContentSha,
        contentCommitUrl,
      })
    } catch (error: any) {
      console.error("Error deleting client logo:", error)
      if (error.status === 409) {
        return res.status(409).json({
          error:
            "Conflict detected while deleting the logo. Please refresh and try again.",
        })
      }
      res.status(500).json({
        error: `Failed to delete client logo: ${(error as Error).message}`,
      })
    }
  }
)

// --- GraphQL Proxy Endpoint (to avoid CORS issues) ---
app.post("/api/graphql", async (req: Request, res: Response) => {
  try {
    const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT || process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
    if (!graphqlEndpoint) {
      return res.status(500).json({
        error: "GraphQL endpoint is not configured. Set GRAPHQL_ENDPOINT or NEXT_PUBLIC_GRAPHQL_ENDPOINT.",
      });
    }

    // Forward the authorization header from the client request
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    } else if (process.env.GRAPHQL_TOKEN || process.env.NEXT_PUBLIC_GRAPHQL_TOKEN) {
      // Fallback to env token if no auth header from client
      headers["Authorization"] = `Bearer ${process.env.GRAPHQL_TOKEN || process.env.NEXT_PUBLIC_GRAPHQL_TOKEN}`;
    }

    // Forward the GraphQL request to the actual endpoint
    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    
    // Forward the status code and response
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error("GraphQL proxy error:", error);
    res.status(500).json({
      error: `GraphQL proxy failed: ${error.message}`,
    });
  }
});

// --- Server Start ---
app.listen(PORT, () =>
  console.log(`✅ Backend server running on http://localhost:${PORT}`)
);
