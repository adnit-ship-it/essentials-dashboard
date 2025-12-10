# Multi-Repository Support Plan (Dynamic Repo Discovery)

## Overview
This dashboard will dynamically discover repositories available through the GitHub App installation and allow users to configure and switch between them via the UI. All repository-specific configuration will be removed from environment variables and managed through the application.

## New Architecture

### Environment Variables (Auth Only - No Repo Config)

#### GitHub App Authentication (Shared across all repos)
- `GITHUB_APP_CLIENT_ID` - GitHub App ID
- `GITHUB_PRIVATE_KEY` - GitHub App private key
- `GITHUB_INSTALLATION_ID` - Installation ID (accesses all repos in the installation)

#### Removed from .env.local (Now User-Configurable)
- ~~`CONTENT_REPO_OWNER`~~ - Fetched from GitHub API
- ~~`CONTENT_REPO_NAME`~~ - Fetched from GitHub API
- ~~`CONTENT_REPO_BRANCH`~~ - Auto-detected or user-configured
- ~~`CONTENT_FILE_PATH`~~ - User-configured per repo
- ~~`CONTENT_PRODUCTS_FILE_PATH`~~ - User-configured per repo
- ~~`CONTENT_TAILWIND_PATH`~~ - User-configured per repo
- ~~`CONTENT_BRAND_LOGO_PATH`~~ - User-configured per repo
- ~~`CONTENT_BRAND_ALT_LOGO_PATH`~~ - User-configured per repo

## How It Works

### 1. Automatic Repository Discovery
- Backend fetches all repositories available to the GitHub App installation
- Uses GitHub API: `GET /installation/repositories`
- Returns list of repos with: `full_name`, `default_branch`, `owner`, `name`

### 2. User Configuration Flow
1. User sees list of available repos from GitHub App installation
2. User selects a repo to configure
3. User provides file paths (with smart defaults):
   - Content file path
   - Products file path
   - Tailwind config path
   - Brand logo paths
4. Configuration saved (localStorage or database)
5. User can switch between configured repos

### 3. Smart Defaults
- Auto-detect default branch from GitHub API
- Provide common default paths (user can override)
- Validate paths exist in repo before saving
- Allow "test connection" to verify access

### GitHub App Requirements
- ✅ GitHub App must be installed on account/organization
- ✅ Installation must have access to all repos you want to manage
- ✅ All repos must be added to the installation (you've already done this)

## Implementation Plan

### Phase 1: Data Model & Storage

#### Storage Strategy: Hybrid Approach
- **Backend**: Store repo configs in database (Supabase) for persistence
- **Frontend**: Cache in localStorage for quick access
- **Fallback**: If no DB, use localStorage only

#### Repository Configuration Schema
```typescript
interface RepoConfig {
  id: string; // Generated: `${owner}/${repo}`
  owner: string; // From GitHub API
  repo: string; // From GitHub API
  defaultBranch: string; // From GitHub API
  displayName?: string; // User-friendly name (defaults to repo name)
  
  // User-configured paths (with defaults)
  contentFilePath: string;
  productsFilePath: string;
  tailwindConfigPath: string;
  brandLogoPath: string;
  brandAltLogoPath: string;
  
  // Metadata
  isConfigured: boolean; // Has user set up file paths?
  lastAccessed?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Recommendation: Start with localStorage, add database sync later**

### Phase 2: Backend Changes

#### 2.1 New API Endpoints

**Repository Discovery & Management:**
- `GET /api/repositories` - List all repos available to installation
- `GET /api/repositories/:repoId` - Get specific repo config
- `POST /api/repositories/:repoId/configure` - Save/update repo configuration
- `POST /api/repositories/:repoId/test` - Test repo access and validate paths
- `DELETE /api/repositories/:repoId` - Remove repo configuration

**Updated Content Endpoints (accept repoId):**
- `GET /api/content?repoId=owner/repo` - Get content for specific repo
- `POST /api/content?repoId=owner/repo` - Update content
- `GET /api/products?repoId=owner/repo` - Get products
- `POST /api/products?repoId=owner/repo` - Update products
- `GET /api/assets?repoId=owner/repo` - Get assets
- `POST /api/assets/update?repoId=owner/repo` - Update asset
- `GET /api/branding?repoId=owner/repo` - Get branding
- `POST /api/branding?repoId=owner/repo` - Update branding

#### 2.2 Repository Discovery Service
```typescript
// lib/services/repo-discovery.ts
async function fetchAvailableRepos(): Promise<GitHubRepo[]> {
  const octokit = await getAuthenticatedClient();
  const { data } = await octokit.request("GET /installation/repositories");
  return data.repositories.map(repo => ({
    id: repo.full_name, // "owner/repo"
    owner: repo.owner.login,
    repo: repo.name,
    defaultBranch: repo.default_branch,
    fullName: repo.full_name,
    description: repo.description,
    private: repo.private,
  }));
}
```

#### 2.3 Repository Configuration Manager
- Load/save configs from database or localStorage
- Validate file paths exist in repo
- Provide defaults based on common patterns
- Cache configurations for performance

#### 2.4 Update All GitHub API Calls
- Accept `repoId` parameter (format: "owner/repo")
- Extract owner and repo from repoId
- Use configured paths from repo config
- Fallback to defaults if not configured

### Phase 3: Frontend Changes

#### 3.1 Create Repository Store
```typescript
interface RepositoryStore {
  // State
  availableRepos: GitHubRepo[]; // From GitHub API
  configuredRepos: RepoConfig[]; // User-configured repos
  selectedRepoId: string | null;
  isLoading: boolean;
  
  // Actions
  fetchAvailableRepos: () => Promise<void>;
  loadConfiguredRepos: () => void; // From localStorage/DB
  saveRepoConfig: (config: RepoConfig) => Promise<void>;
  selectRepo: (repoId: string) => void;
  testRepoConnection: (repoId: string) => Promise<boolean>;
}
```

#### 3.2 Repository Management UI Components

**Repository Selector (Sidebar/Header):**
- Dropdown showing configured repos
- "Add Repository" button
- Shows repo status (configured/unconfigured)
- Quick switch between repos

**Repository Setup Modal:**
- List of available repos from GitHub
- For each repo:
  - Configure button (if not configured)
  - Edit button (if configured)
  - Test connection button
- Form fields for file paths with smart defaults
- Path validation (check if files exist)
- Save configuration

**Repository Settings Page:**
- List all configured repos
- Edit/delete configurations
- Test connections
- View repo details

#### 3.3 Update All API Calls
- Add `repoId` query parameter: `?repoId=${selectedRepoId}`
- Handle "no repo selected" state
- Show error if repo not configured
- Auto-reload data when repo changes

#### 3.4 Update UI Components
- All sections check for selected repo
- Show "Select a repository" message if none selected
- Reload data when repo changes
- Show current repo name in header
- Handle loading states during repo switch

### Phase 4: Smart Defaults & Path Detection

#### 4.1 Auto-Detect Common File Patterns
- Scan repo for common content file names:
  - `data/content.json`
  - `src/data/content.json`
  - `content.json`
  - `data/site-content.json`
- Scan for products files:
  - `data/intake-form/products.ts`
  - `data/products.json`
  - `src/data/products.ts`
- Scan for Tailwind config:
  - `tailwind.config.js`
  - `tailwind.config.ts`
- Scan for brand assets:
  - `public/assets/images/brand/logo.svg`
  - `public/logo.svg`
  - `assets/brand/logo.svg`

#### 4.2 Path Validation
- Before saving config, verify files exist in repo
- Show helpful error messages if paths are wrong
- Suggest correct paths if file found with different name

## File Structure Changes

```
/
├── lib/
│   ├── services/
│   │   ├── repo-discovery.ts     # Fetch repos from GitHub API
│   │   └── repo-config.ts        # Load/save repo configs
│   └── stores/
│       └── repository-store.ts   # Frontend repo store
├── components/
│   └── features/
│       └── repository/
│           ├── repository-selector.tsx      # Dropdown in sidebar
│           ├── repository-setup-modal.tsx   # Configure new repo
│           ├── repository-settings.tsx      # Settings page
│           └── repo-config-form.tsx         # Form for paths
├── app/
│   └── api/
│       └── repositories/
│           ├── route.ts          # GET /api/repositories
│           └── [repoId]/
│               ├── route.ts      # GET/POST/DELETE specific repo
│               ├── configure/
│               │   └── route.ts  # POST configure
│               └── test/
│                   └── route.ts  # POST test connection
└── server.ts                      # Updated with repo support
```

## Example Repository Configuration (Stored in localStorage/DB)

```typescript
// Example: localStorage key "repo-configs"
{
  "owner/repo-1": {
    "id": "owner/repo-1",
    "owner": "owner",
    "repo": "repo-1",
    "defaultBranch": "main",
    "displayName": "Main Content Repo",
    "contentFilePath": "data/content.json",
    "productsFilePath": "data/intake-form/products.ts",
    "tailwindConfigPath": "tailwind.config.js",
    "brandLogoPath": "public/assets/images/brand/logo.svg",
    "brandAltLogoPath": "public/assets/images/brand/logo-alt.svg",
    "isConfigured": true,
    "lastAccessed": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "owner/repo-2": {
    "id": "owner/repo-2",
    "owner": "owner",
    "repo": "repo-2",
    "defaultBranch": "main",
    "displayName": "Client A Content",
    "contentFilePath": "data/content.json",
    "productsFilePath": "data/intake-form/products.ts",
    "tailwindConfigPath": "tailwind.config.js",
    "brandLogoPath": "public/assets/images/brand/logo.svg",
    "brandAltLogoPath": "public/assets/images/brand/logo-alt.svg",
    "isConfigured": true,
    "lastAccessed": "2024-01-14T15:20:00Z",
    "createdAt": "2024-01-12T09:00:00Z",
    "updatedAt": "2024-01-14T15:20:00Z"
  }
}
```

## Migration Strategy

1. **Remove Repo-Specific Env Vars**: Clean up .env.local (keep only auth vars)
2. **Backward Compatibility**: Support old env vars as fallback during transition
3. **Gradual Rollout**: 
   - Phase 1: Add repo discovery API
   - Phase 2: Add repository selector UI
   - Phase 3: Update all endpoints to use repoId
   - Phase 4: Remove env var fallbacks
4. **Testing**: Test with one repo first, then add others

## Implementation Steps

### Step 1: Backend - Repository Discovery API
- [ ] Create `lib/services/repo-discovery.ts` to fetch repos from GitHub
- [ ] Add `GET /api/repositories` endpoint to list available repos
- [ ] Test with your GitHub App installation

### Step 2: Backend - Repository Configuration API
- [ ] Create `POST /api/repositories/:repoId/configure` endpoint
- [ ] Create `GET /api/repositories/:repoId` endpoint
- [ ] Create `POST /api/repositories/:repoId/test` endpoint (validate paths)
- [ ] Store configs in database or return for localStorage storage

### Step 3: Backend - Update Content Endpoints
- [ ] Update all endpoints to accept `repoId` query parameter
- [ ] Extract owner/repo from repoId
- [ ] Load repo config (from DB or request)
- [ ] Use configured paths or defaults
- [ ] Keep env var fallback for backward compatibility

### Step 4: Frontend - Repository Store
- [ ] Create `lib/stores/repository-store.ts` with Zustand
- [ ] Add actions: fetchAvailableRepos, loadConfigs, saveConfig, selectRepo
- [ ] Persist selected repo and configs in localStorage
- [ ] Sync with backend API

### Step 5: Frontend - Repository Selector UI
- [ ] Create `components/features/repository/repository-selector.tsx`
- [ ] Show dropdown with configured repos
- [ ] Add "Configure Repository" button
- [ ] Add to sidebar/header
- [ ] Handle repo switching

### Step 6: Frontend - Repository Setup Modal
- [ ] Create `components/features/repository/repository-setup-modal.tsx`
- [ ] List available repos from GitHub
- [ ] Show configure form with path inputs
- [ ] Add smart defaults based on common patterns
- [ ] Validate paths before saving
- [ ] Save configuration

### Step 7: Frontend - Update All Components
- [ ] Update all API calls to include `?repoId=${selectedRepoId}`
- [ ] Add repo change listeners to reload data
- [ ] Show "Select Repository" state if none selected
- [ ] Handle loading and error states

### Step 8: Cleanup & Testing
- [ ] Remove repo-specific env vars from .env.local
- [ ] Test repo discovery
- [ ] Test configuring each repo
- [ ] Test switching between repos
- [ ] Test all CRUD operations for each repo
- [ ] Test error handling (invalid paths, no access, etc.)

## Key Features

### ✅ Automatic Discovery
- Fetches all repos available to GitHub App installation
- No manual configuration needed to see available repos
- Shows repo status (configured/unconfigured)

### ✅ User-Friendly Configuration
- Simple form to set file paths per repo
- Smart defaults based on common patterns
- Path validation before saving
- Test connection to verify access

### ✅ Flexible Storage
- Start with localStorage (simple, works immediately)
- Can migrate to database later (Supabase)
- Syncs between frontend and backend

### ✅ Seamless Switching
- Quick repo selector in sidebar
- Auto-reloads all data when switching
- Persists last selected repo
- Shows current repo in UI

## Assumptions

1. **All repos use same GitHub App installation** ✅ (You've confirmed this)
2. **File structures may differ** - Users configure paths per repo
3. **Storage**: Start with localStorage, add DB sync later
4. **User Experience**: Simple setup flow, smart defaults, validation

## User Flow

### First Time Setup
1. User opens dashboard
2. System fetches available repos from GitHub App
3. User sees list of repos (some may be unconfigured)
4. User clicks "Configure" on a repo
5. System shows form with smart defaults for file paths
6. User adjusts paths if needed, clicks "Test Connection"
7. System validates paths exist in repo
8. User saves configuration
9. Repo is now available for use

### Daily Usage
1. User opens dashboard
2. System loads configured repos from localStorage/DB
3. User selects repo from dropdown (or uses last selected)
4. Dashboard loads content for selected repo
5. User can switch repos anytime via dropdown
6. All data reloads automatically when switching

## Next Steps

1. **Verify GitHub App Setup**: Ensure all 3 repos are accessible via installation
2. **Start Implementation**: Begin with Step 1 (repository discovery API)
3. **Test Discovery**: Verify you can fetch all repos from GitHub
4. **Build UI**: Create repository selector and setup modal
5. **Configure Repos**: Set up file paths for each repo via UI
6. **Test Everything**: Switch between repos and test all features

