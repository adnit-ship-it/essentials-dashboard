import { create } from 'zustand';
import type { GitHubRepo, RepoConfig } from '@/lib/types/repository';

interface RepositoryStore {
  // State
  availableRepos: GitHubRepo[];
  configuredRepos: RepoConfig[];
  selectedRepoId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAvailableRepos: () => Promise<void>;
  loadConfiguredRepos: () => void;
  saveRepoConfig: (config: RepoConfig) => Promise<void>;
  selectRepo: (repoId: string | null) => void;
  testRepoConnection: (repoId: string, paths: Record<string, string>, repoInfo?: { owner: string; repo: string; branch: string }) => Promise<{ status: string; results: any[] }>;
  deleteRepoConfig: (repoId: string) => Promise<void>;
  clearError: () => void;
}

const STORAGE_KEYS = {
  SELECTED_REPO: 'selected-repo-id',
  CONFIGURED_REPOS: 'configured-repos',
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useRepositoryStore = create<RepositoryStore>((set, get) => ({
  availableRepos: [],
  configuredRepos: [],
  selectedRepoId: null,
  isLoading: false,
  error: null,

  fetchAvailableRepos: async () => {
    set({ isLoading: true, error: null });
    try {
      // First, load from localStorage
      get().loadConfiguredRepos();
      
      // Sync localStorage configs to backend
      const { configuredRepos: localConfigs } = get();
      if (localConfigs.length > 0) {
        // Try to sync each config to backend (ignore errors if they already exist)
        await Promise.allSettled(
          localConfigs.map(async (config) => {
            try {
              const encodedRepoId = encodeURIComponent(config.id);
              await fetch(`${API_BASE_URL}/api/repositories/${encodedRepoId}/configure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
              });
            } catch (error) {
              // Ignore errors - config might already exist or network issue
              console.warn(`Failed to sync config for ${config.id}:`, error);
            }
          })
        );
      }
      
      const response = await fetch(`${API_BASE_URL}/api/repositories`);
      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.statusText}`);
      }
      const data = await response.json();
      set({ 
        availableRepos: data.repositories || [],
        configuredRepos: data.configured || localConfigs, // Use backend configs, fallback to local
        isLoading: false 
      });
      
      // Update localStorage with backend configs if they exist
      if (data.configured && data.configured.length > 0) {
        localStorage.setItem(STORAGE_KEYS.CONFIGURED_REPOS, JSON.stringify(data.configured));
        set({ configuredRepos: data.configured });
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch repositories',
        isLoading: false 
      });
    }
  },

  loadConfiguredRepos: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIGURED_REPOS);
      if (stored) {
        const configs = JSON.parse(stored) as RepoConfig[];
        set({ configuredRepos: configs });
        
        // Restore selected repo if it exists
        const selectedId = localStorage.getItem(STORAGE_KEYS.SELECTED_REPO);
        if (selectedId && configs.find(c => c.id === selectedId)) {
          set({ selectedRepoId: selectedId });
        }
      }
    } catch (error) {
      console.error('Error loading configured repos from localStorage:', error);
    }
  },

  saveRepoConfig: async (config: RepoConfig) => {
    set({ isLoading: true, error: null });
    try {
      // URL encode the repoId to handle slashes (owner/repo format)
      const encodedRepoId = encodeURIComponent(config.id);
      const response = await fetch(`${API_BASE_URL}/api/repositories/${encodedRepoId}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save configuration: ${response.statusText}`);
      }

      const { config: savedConfig } = await response.json();
      
      // Update local state
      const { configuredRepos } = get();
      const existingIndex = configuredRepos.findIndex(c => c.id === config.id);
      const updated = existingIndex >= 0
        ? configuredRepos.map((c, i) => i === existingIndex ? savedConfig : c)
        : [...configuredRepos, savedConfig];
      
      set({ configuredRepos: updated, isLoading: false });
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.CONFIGURED_REPOS, JSON.stringify(updated));
      
      // Auto-select if no repo is selected
      if (!get().selectedRepoId) {
        get().selectRepo(config.id);
      }
    } catch (error) {
      console.error('Error saving repo config:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save repository configuration',
        isLoading: false 
      });
      throw error;
    }
  },

  selectRepo: (repoId: string | null) => {
    set({ selectedRepoId: repoId });
    if (repoId) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_REPO, repoId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_REPO);
    }
  },

  testRepoConnection: async (repoId: string, paths: Record<string, string>, repoInfo?: { owner: string; repo: string; branch: string }) => {
    set({ isLoading: true, error: null });
    try {
      // URL encode the repoId to handle slashes (owner/repo format)
      const encodedRepoId = encodeURIComponent(repoId);
      const response = await fetch(`${API_BASE_URL}/api/repositories/${encodedRepoId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paths,
          // Include repo info for unconfigured repos
          ...(repoInfo ? { owner: repoInfo.owner, repo: repoInfo.repo, branch: repoInfo.branch } : {})
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to test connection: ${response.statusText}`);
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error testing repo connection:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to test repository connection',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteRepoConfig: async (repoId: string) => {
    set({ isLoading: true, error: null });
    try {
      // URL encode the repoId to handle slashes (owner/repo format)
      const encodedRepoId = encodeURIComponent(repoId);
      const response = await fetch(`${API_BASE_URL}/api/repositories/${encodedRepoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete configuration: ${response.statusText}`);
      }

      // Update local state
      const { configuredRepos, selectedRepoId } = get();
      const updated = configuredRepos.filter(c => c.id !== repoId);
      set({ configuredRepos: updated, isLoading: false });
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.CONFIGURED_REPOS, JSON.stringify(updated));
      
      // Clear selection if deleted repo was selected
      if (selectedRepoId === repoId) {
        get().selectRepo(null);
      }
    } catch (error) {
      console.error('Error deleting repo config:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete repository configuration',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

