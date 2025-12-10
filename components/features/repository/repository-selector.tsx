"use client"

import { useEffect, useState } from "react"
import { useRepositoryStore } from "@/lib/stores/repository-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { GitBranch, Plus, Loader2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface RepositorySelectorProps {
  onConfigureRepository: () => void
  isCollapsed?: boolean
}

export function RepositorySelector({ onConfigureRepository, isCollapsed = false }: RepositorySelectorProps) {
  const { 
    configuredRepos, 
    selectedRepoId, 
    selectRepo, 
    isLoading,
    fetchAvailableRepos,
    deleteRepoConfig
  } = useRepositoryStore()
  
  const [deletingRepoId, setDeletingRepoId] = useState<string | null>(null)

  useEffect(() => {
    // Fetch available repos on mount
    fetchAvailableRepos()
  }, [fetchAvailableRepos])

  const selectedRepo = configuredRepos.find(r => r.id === selectedRepoId)

  const handleDelete = async (repoId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent select from opening
    if (!confirm(`Are you sure you want to remove the configuration for "${configuredRepos.find(r => r.id === repoId)?.displayName || repoId}"?`)) {
      return
    }
    
    setDeletingRepoId(repoId)
    try {
      await deleteRepoConfig(repoId)
      // If the deleted repo was selected, clear selection
      if (selectedRepoId === repoId) {
        selectRepo(null)
      }
    } catch (error) {
      console.error('Error deleting repository:', error)
      alert(`Failed to delete repository: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeletingRepoId(null)
    }
  }

  if (isLoading && configuredRepos.length === 0) {
    return (
      <div className={cn(
        "w-full justify-start gap-3 text-sidebar-foreground bg-transparent rounded-md transition-all duration-200",
        isCollapsed ? "px-2 py-2" : "px-3 py-2"
      )}>
        <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
        {!isCollapsed && (
          <span className="text-sm transition-opacity duration-300 whitespace-nowrap">
            Loading repositories...
          </span>
        )}
      </div>
    )
  }

  if (isCollapsed) {
    return (
      <div className="px-2 py-2 space-y-2">
        <Button
          className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-accent-color hover:text-background-color justify-center p-2"
          title={selectedRepo?.displayName || selectedRepo?.repo || "Select Repository"}
        >
          <GitBranch className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={onConfigureRepository}
          className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-accent-color hover:text-background-color justify-center p-2"
          title="Configure Repository"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (configuredRepos.length === 0) {
    return (
      <div className="px-3 py-2 space-y-2">
        <div className="text-sm text-sidebar-foreground/70 mb-2">
          No repositories configured
        </div>
        <Button
          onClick={onConfigureRepository}
          className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-accent-color hover:text-background-color justify-start gap-3"
        >
          <Plus className="h-4 w-4" />
          Configure Repository
        </Button>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 space-y-2">
      <Select
        value={selectedRepoId || undefined}
        onValueChange={(value) => selectRepo(value)}
      >
        <SelectTrigger className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-accent-color hover:text-background-color">
          <div className="flex items-center gap-3">
            <GitBranch className="h-4 w-4" />
            <SelectValue placeholder="Select Repository" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {configuredRepos.map((repo) => (
            <div key={repo.id} className="group relative">
              <SelectItem value={repo.id} className="pr-8">
                {repo.displayName || repo.repo}
              </SelectItem>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDelete(repo.id, e)
                }}
                disabled={deletingRepoId === repo.id}
                title="Delete configuration"
              >
                {deletingRepoId === repo.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        onClick={onConfigureRepository}
        className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-accent-color hover:text-background-color justify-start gap-3"
      >
        <Plus className="h-4 w-4" />
        Configure Repository
      </Button>
    </div>
  )
}

