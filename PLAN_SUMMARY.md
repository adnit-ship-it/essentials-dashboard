# Multi-Repo Support Plan - Executive Summary

## What Changed

### ❌ Removed from .env.local
All repository-specific configuration is now **user-configurable via UI**:
- `CONTENT_REPO_OWNER` → Auto-fetched from GitHub
- `CONTENT_REPO_NAME` → Auto-fetched from GitHub  
- `CONTENT_REPO_BRANCH` → Auto-detected from GitHub
- `CONTENT_FILE_PATH` → User configures per repo
- `CONTENT_PRODUCTS_FILE_PATH` → User configures per repo
- `CONTENT_TAILWIND_PATH` → User configures per repo
- `CONTENT_BRAND_LOGO_PATH` → User configures per repo
- `CONTENT_BRAND_ALT_LOGO_PATH` → User configures per repo

### ✅ Kept in .env.local (Auth Only)
- `GITHUB_APP_CLIENT_ID`
- `GITHUB_PRIVATE_KEY`
- `GITHUB_INSTALLATION_ID`

## How It Works

### 1. **Automatic Discovery**
- Dashboard fetches all repos available to your GitHub App installation
- No manual setup needed - repos appear automatically
- Uses GitHub API: `GET /installation/repositories`

### 2. **User Configuration**
- User selects a repo from the list
- Fills in file paths (with smart defaults)
- System validates paths exist in repo
- Configuration saved (localStorage or database)

### 3. **Easy Switching**
- Dropdown in sidebar to switch between configured repos
- All data reloads automatically when switching
- Last selected repo persists

## Implementation Phases

### Phase 1: Backend Discovery API
- Fetch repos from GitHub App installation
- List available repos endpoint

### Phase 2: Backend Configuration API
- Save/load repo configurations
- Test connection endpoint
- Validate file paths

### Phase 3: Frontend Store & UI
- Repository store (Zustand)
- Repository selector dropdown
- Setup modal for configuring repos

### Phase 4: Update All Endpoints
- Add `repoId` parameter to all API calls
- Update all components to use selected repo

## Key Benefits

✅ **No more env var management** - Everything in UI  
✅ **Automatic repo discovery** - See all available repos instantly  
✅ **Per-repo configuration** - Different file paths per repo  
✅ **Smart defaults** - System suggests common paths  
✅ **Path validation** - Verify files exist before saving  
✅ **Easy switching** - Change repos with one click  

## What You Need to Do

1. ✅ **Already Done**: Added repos to GitHub App installation
2. **Next**: Review the full plan in `MULTI_REPO_PLAN.md`
3. **Then**: We'll start implementing Step 1 (Repository Discovery API)

## User Experience

**First Time:**
1. Open dashboard → See list of available repos
2. Click "Configure" on a repo
3. Fill in file paths (or use defaults)
4. Click "Test Connection" to validate
5. Save configuration

**Daily Use:**
1. Open dashboard → Last repo auto-selected
2. Use dropdown to switch repos
3. All data reloads automatically

---

**Full details**: See `MULTI_REPO_PLAN.md`

