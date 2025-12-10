# Repository Information Checklist

Use this checklist to gather the required information from each of your content repositories.

## For Each Repository, Collect:

### 1. Repository Details
- [ ] **Repository Owner**: `_________________` (GitHub username or organization name)
- [ ] **Repository Name**: `_________________` (The repository name)
- [ ] **Default Branch**: `_________________` (Usually "main" or "master")
- [ ] **Display Name**: `_________________` (Friendly name, e.g., "Client A Content")

### 2. File Paths
- [ ] **Content File Path**: `_________________` 
  - Path to your main content JSON file
  - Example: `data/content.json` or `src/data/content.json`
  
- [ ] **Products File Path**: `_________________`
  - Path to products TypeScript/JSON file
  - Example: `data/intake-form/products.ts` or `src/data/products.json`
  
- [ ] **Tailwind Config Path**: `_________________`
  - Usually: `tailwind.config.js` or `tailwind.config.ts`
  
- [ ] **Primary Logo Path**: `_________________`
  - Example: `public/assets/images/brand/logo.svg`
  
- [ ] **Secondary/Alt Logo Path**: `_________________`
  - Example: `public/assets/images/brand/logo-alt.svg`

### 3. GitHub App Access
- [ ] **Is the GitHub App installed on this repo's account/org?** Yes / No
- [ ] **Installation ID** (if different from current): `_________________`
  - Usually the same for all repos under same account/org

## Example Template

Fill this out for each repository:

```json
{
  "id": "repo-1",
  "name": "Main Content Repo",
  "owner": "your-org",
  "repo": "content-repo-1",
  "branch": "main",
  "contentFilePath": "data/content.json",
  "productsFilePath": "data/intake-form/products.ts",
  "tailwindConfigPath": "tailwind.config.js",
  "brandLogoPath": "public/assets/images/brand/logo.svg",
  "brandAltLogoPath": "public/assets/images/brand/logo-alt.svg"
}
```

## How to Find This Information

### Repository Owner & Name
1. Go to your repository on GitHub
2. Look at the URL: `https://github.com/{OWNER}/{REPO}`
3. Owner is the first part, Repo is the second part

### Default Branch
1. Go to your repository on GitHub
2. Look at the branch dropdown (usually shows "main" or "master")
3. Or check repository settings → Default branch

### File Paths
1. Browse your repository on GitHub
2. Navigate to each file
3. Copy the path from the URL or file tree
4. Make sure to include the full path from the repo root

### GitHub App Installation
1. Go to your repository → Settings → Integrations → GitHub Apps
2. Check if your app is listed
3. If not, install it on the account/organization
4. Use the same Installation ID if all repos are under the same account

## Quick Check: Are File Structures Identical?

If all your repos have the **exact same file structure**, you can:
- Use the same paths for all repos
- Only need to change `owner` and `repo` for each

If file structures are **different**, you'll need to specify paths for each repo individually.

