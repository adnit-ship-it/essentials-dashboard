"use client"

import { useState, useEffect } from "react"
import { useRepositoryStore } from "@/lib/stores/repository-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Loader2, AlertCircle, GitBranch, Sparkles } from "lucide-react"
import type { TemplateRepo } from "@/lib/stores/repository-store"

interface RepositoryCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onRepositoryCreated: () => void
}

export function RepositoryCreateModal({
  isOpen,
  onClose,
  onRepositoryCreated,
}: RepositoryCreateModalProps) {
  const { createRepoFromTemplate, fetchTemplateRepos, isLoading } = useRepositoryStore()
  
  const [templates, setTemplates] = useState<TemplateRepo[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [newRepoName, setNewRepoName] = useState("")
  const [description, setDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

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
      await createRepoFromTemplate(
        selectedTemplateId,
        newRepoName.trim(),
        description || undefined,
        isPrivate
      )
      onRepositoryCreated()
      onClose()
      // Reset form
      setSelectedTemplateId("")
      setNewRepoName("")
      setDescription("")
      setIsPrivate(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create repository")
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Create Repository from Template
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Create a new repository based on one of your templates. All repositories will be created under the adnit-ship-it organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template-select">Template Repository</Label>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading templates...
                </div>
              ) : (
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.length === 0 ? (
                      <SelectItem value="" disabled>
                        No templates available
                      </SelectItem>
                    ) : (
                      templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">{template.id}</div>
                            {template.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {template.description}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                Only alphanumeric characters, dots, hyphens, and underscores are allowed
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
        </CardContent>
      </Card>
    </div>
  )
}

