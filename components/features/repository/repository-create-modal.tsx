"use client"

import { useState, useEffect, useRef } from "react"
import { useRepositoryStore } from "@/lib/stores/repository-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X, Loader2, AlertCircle, GitBranch, Sparkles, Link2, Check, Search, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import type { TemplateRepo } from "@/lib/stores/repository-store"

interface RepositoryCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onRepositoryCreated: (owner: string | null, repo: string | null, isNewlyCreated?: boolean) => void
}

type Mode = "create" | "link"

export function RepositoryCreateModal({
  isOpen,
  onClose,
  onRepositoryCreated,
}: RepositoryCreateModalProps) {
  const { createRepoFromTemplate, fetchTemplateRepos, fetchAvailableRepos, availableRepos, isLoading } = useRepositoryStore()
  const { selectedOrgId, repoOwnerFromLink, repoNameFromLink, updatePartnerIntegrationBillOfRights } = useOrganizationStore()
  
  const [mode, setMode] = useState<Mode>("create")
  const [templates, setTemplates] = useState<TemplateRepo[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [newRepoName, setNewRepoName] = useState("")
  const [description, setDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [selectedExistingRepo, setSelectedExistingRepo] = useState("")
  const [creating, setCreating] = useState(false)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false)
  const [repoSearchQuery, setRepoSearchQuery] = useState("")
  const [highlightedRepoIndex, setHighlightedRepoIndex] = useState(-1)
  const repoSearchInputRef = useRef<HTMLInputElement>(null)
  const repoListRef = useRef<HTMLDivElement>(null)

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates()
      fetchAvailableRepos()
      // If org has a linked repo, default to "link" mode and show current repo
      if (repoOwnerFromLink && repoNameFromLink) {
        setMode("link")
        const currentRepoId = `${repoOwnerFromLink}/${repoNameFromLink}`
        setSelectedExistingRepo(currentRepoId)
      } else {
        setMode("create")
      }
    }
  }, [isOpen, repoOwnerFromLink, repoNameFromLink, fetchAvailableRepos])

  // Filter repos to only show those from adnit-ship-it
  const adnitRepos = availableRepos.filter(repo => repo.owner === "adnit-ship-it")

  // Filter repositories based on search query
  const filteredRepos = adnitRepos.filter(repo => {
    if (!repoSearchQuery.trim()) return true
    const query = repoSearchQuery.toLowerCase()
    return (
      repo.repo.toLowerCase().includes(query) ||
      repo.id.toLowerCase().includes(query) ||
      (repo.description && repo.description.toLowerCase().includes(query))
    )
  })

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (repoDropdownOpen && repoSearchInputRef.current) {
      setTimeout(() => {
        repoSearchInputRef.current?.focus()
      }, 100)
    }
  }, [repoDropdownOpen])

  // Reset highlighted index when search changes or repos change
  useEffect(() => {
    setHighlightedRepoIndex(-1)
  }, [repoSearchQuery, filteredRepos.length])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedRepoIndex >= 0 && repoListRef.current) {
      const items = repoListRef.current.querySelectorAll('[data-repo-index]')
      const highlightedItem = items[highlightedRepoIndex] as HTMLElement
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [highlightedRepoIndex])

  const handleRepoSelect = (repoId: string) => {
    setSelectedExistingRepo(repoId)
    setRepoDropdownOpen(false)
    setRepoSearchQuery("")
    setHighlightedRepoIndex(-1)
  }

  const handleRepoKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedRepoIndex((prev) => {
        if (prev < filteredRepos.length - 1) {
          return prev + 1
        }
        return 0 // Wrap to start
      })
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedRepoIndex((prev) => {
        if (prev > 0) {
          return prev - 1
        }
        return filteredRepos.length - 1 // Wrap to end
      })
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightedRepoIndex >= 0 && highlightedRepoIndex < filteredRepos.length) {
        handleRepoSelect(filteredRepos[highlightedRepoIndex].id)
      }
    } else if (e.key === "Escape") {
      setRepoDropdownOpen(false)
      setRepoSearchQuery("")
      setHighlightedRepoIndex(-1)
    }
  }

  const selectedRepo = adnitRepos.find(repo => repo.id === selectedExistingRepo)

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    setError(null)
    try {
      const templateList = await fetchTemplateRepos()
      setTemplates(templateList)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates")
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplateId || !newRepoName.trim()) {
      setError("Please select a template and enter a repository name")
      return
    }

    // Validate repo name format
    if (!/^[a-zA-Z0-9._-]+$/.test(newRepoName.trim())) {
      setError("Invalid repository name. Only alphanumeric characters, dots, hyphens, and underscores are allowed.")
      return
    }

    setCreating(true)
    setError(null)
    try {
      const result = await createRepoFromTemplate(
        selectedTemplateId,
        newRepoName.trim(),
        description || undefined,
        isPrivate
      )
      
      // Get the actual repo name (with store- prefix)
      const actualRepoName = result.repository?.name || result.config?.repo || `store-${newRepoName.trim()}`
      const actualRepoOwner = result.repository?.owner?.login || result.config?.owner || "adnit-ship-it"
      
      // Show success toast
      toast.success(`Repository '${actualRepoName}' created successfully!`)
      
      // Reset form
      setSelectedTemplateId("")
      setNewRepoName("")
      setDescription("")
      setIsPrivate(false)
      
      // Link to organization if one is selected
      if (selectedOrgId) {
        try {
          await updatePartnerIntegrationBillOfRights({
            repoOwner: actualRepoOwner,
            repoName: actualRepoName,
          })
          toast.success(`Repository linked to organization successfully!`)
          onRepositoryCreated(actualRepoOwner, actualRepoName)
          onClose()
        } catch (linkError) {
          console.error("Error linking repository:", linkError)
          // Still notify parent about creation, but don't link
          onRepositoryCreated(actualRepoOwner, actualRepoName)
          onClose()
        }
      } else {
        onRepositoryCreated(actualRepoOwner, actualRepoName)
        onClose()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create repository"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExistingRepo) {
      setError("Please select a repository to link")
      return
    }

    if (!selectedOrgId) {
      setError("No organization selected")
      return
    }

    setLinking(true)
    setError(null)
    try {
      // Parse repo ID (format: "owner/repo")
      const [owner, repo] = selectedExistingRepo.split("/")
      if (!owner || !repo) {
        throw new Error("Invalid repository format")
      }

      await updatePartnerIntegrationBillOfRights({
        repoOwner: owner,
        repoName: repo,
      })
      
      toast.success(`Repository '${repo}' linked to organization successfully!`)
      onRepositoryCreated(owner, repo)
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to link repository"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLinking(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {mode === "create" ? <Sparkles className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
              {mode === "create" ? "Create Repository" : "Link Repository"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {mode === "create" 
              ? "Create a new repository based on one of your templates. All repositories will be created under the adnit-ship-it organization."
              : "Link an existing repository to your organization. This will allow the dashboard to fetch content from it."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
            <Button
              type="button"
              variant={mode === "create" ? "default" : "ghost"}
              className="flex-1"
              onClick={() => {
                setMode("create")
                setError(null)
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create New
            </Button>
            <Button
              type="button"
              variant={mode === "link" ? "default" : "ghost"}
              className="flex-1"
              onClick={() => {
                setMode("link")
                setError(null)
                fetchAvailableRepos()
              }}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Link Existing
            </Button>
          </div>

          {/* Current Linked Repo Info */}
          {mode === "link" && repoOwnerFromLink && repoNameFromLink && (
            <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200">
              <div className="text-sm font-medium text-blue-900">Current Linked Repository:</div>
              <div className="text-sm text-blue-700">{repoOwnerFromLink}/{repoNameFromLink}</div>
            </div>
          )}

          {mode === "create" ? (
            <form onSubmit={handleCreate} className="space-y-6">
              {/* Template Selection - Card Based */}
              <div className="space-y-2">
                <Label htmlFor="template-select">Template Repository</Label>
                {loadingTemplates ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading templates...
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 border rounded-md">
                    No templates available
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedTemplateId}
                    onValueChange={setSelectedTemplateId}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    {templates.map((template) => {
                      const isSelected = selectedTemplateId === template.id
                      return (
                        <div key={template.id} className="relative">
                          <RadioGroupItem
                            value={template.id}
                            id={template.id}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={template.id}
                            className={cn(
                              "block cursor-pointer rounded-lg border-2 p-4 transition-all",
                              "bg-card hover:bg-accent",
                              isSelected
                                ? "border-[#DDF0E3] bg-gradient-to-r from-[#DDF0E3] to-[#D3EBEB]"
                                : "border-border hover:border-[#DDF0E3]/50"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className={cn(
                                  "font-medium mb-1",
                                  isSelected ? "text-black" : "text-foreground"
                                )}>
                                  {template.name}
                                </div>
                                <div className="text-xs text-muted-foreground mb-2">
                                  {template.id}
                                </div>
                                {template.description && (
                                  <div className="text-sm text-muted-foreground">
                                    {template.description}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <div className="ml-2 flex-shrink-0">
                                  <div className="rounded-full bg-gradient-to-r from-[#DDF0E3] to-[#D3EBEB] p-1 border border-black/10">
                                    <Check className="h-3 w-3 text-black" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      )
                    })}
                  </RadioGroup>
                )}
              </div>

              {/* New Repository Name */}
              <div className="space-y-2">
                <Label htmlFor="repo-name">New Repository Name</Label>
                <Input
                  id="repo-name"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="my-new-repo"
                  required
                  disabled={creating}
                />
                <p className="text-xs text-muted-foreground">
                  Only alphanumeric characters, dots, hyphens, and underscores are allowed. The "store-" prefix will be added automatically.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Repository description"
                  disabled={creating}
                />
              </div>

              {/* Privacy */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded"
                  disabled={creating}
                />
                <Label htmlFor="is-private" className="cursor-pointer">
                  Make this repository private
                </Label>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onClose} disabled={creating}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={creating || !selectedTemplateId || !newRepoName.trim() || loadingTemplates}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <GitBranch className="h-4 w-4 mr-2" />
                      Create Repository
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLink} className="space-y-6">
              {/* Existing Repository Selection */}
              <div className="space-y-2">
                <Label htmlFor="existing-repo-select">Select Repository</Label>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading repositories...
                  </div>
                ) : (
                  <PopoverPrimitive.Root 
                    open={repoDropdownOpen} 
                    onOpenChange={(open) => {
                      setRepoDropdownOpen(open)
                      if (!open) {
                        setRepoSearchQuery("")
                        setHighlightedRepoIndex(-1)
                      }
                    }}
                  >
                    <PopoverPrimitive.Trigger asChild>
                      <Button
                        id="existing-repo-select"
                        variant="outline"
                        className="w-full justify-between h-10 bg-background-color text-body-color border border-gray-300"
                        onClick={() => {
                          setRepoDropdownOpen(true)
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
                          {selectedRepo ? (
                            <div className="truncate">
                              <div className="font-medium truncate">{selectedRepo.repo}</div>
                              <div className="text-xs text-muted-foreground truncate">{selectedRepo.id}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Select a repository...</span>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                      </Button>
                    </PopoverPrimitive.Trigger>
                    <PopoverPrimitive.Portal>
                      <PopoverPrimitive.Content
                        className={cn(
                          "z-50 min-w-[500px] rounded-md border border-gray-300 bg-background-color p-1 shadow-md",
                          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                        )}
                        align="start"
                        sideOffset={4}
                        onKeyDown={handleRepoKeyDown}
                      >
                        {/* Search Input */}
                        <div className="flex items-center border-b border-gray-300 px-3 py-2">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
                          <Input
                            ref={repoSearchInputRef}
                            placeholder="Search repositories..."
                            value={repoSearchQuery}
                            onChange={(e) => setRepoSearchQuery(e.target.value)}
                            onKeyDown={handleRepoKeyDown}
                            className="h-8 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-body-color placeholder:text-muted-foreground"
                          />
                        </div>
                        
                        {/* Repositories List */}
                        <div ref={repoListRef} className="max-h-[300px] overflow-auto">
                          {filteredRepos.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              {repoSearchQuery ? "No repositories found" : "No repositories available"}
                            </div>
                          ) : (
                            filteredRepos.map((repo, index) => (
                              <button
                                key={repo.id}
                                data-repo-index={index}
                                onClick={() => handleRepoSelect(repo.id)}
                                className={cn(
                                  "w-full flex items-start gap-2 px-3 py-2 text-sm rounded-sm transition-colors text-left",
                                  "hover:bg-accent-color hover:text-background-color",
                                  selectedExistingRepo === repo.id && "bg-accent-color/50",
                                  highlightedRepoIndex === index && "bg-accent-color/70"
                                )}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">{repo.repo}</div>
                                  <div className="text-xs text-muted-foreground">{repo.id}</div>
                                  {repo.description && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      {repo.description}
                                    </div>
                                  )}
                                </div>
                                {selectedExistingRepo === repo.id && (
                                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverPrimitive.Content>
                    </PopoverPrimitive.Portal>
                  </PopoverPrimitive.Root>
                )}
                <p className="text-xs text-muted-foreground">
                  Repositories from adnit-ship-it organization
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onClose} disabled={linking}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={linking || !selectedExistingRepo || isLoading}
                >
                  {linking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      {repoOwnerFromLink && repoNameFromLink ? "Change Repository" : "Link Repository"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
