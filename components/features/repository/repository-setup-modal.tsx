"use client"

import { useState, useEffect } from "react"
import { useRepositoryStore } from "@/lib/stores/repository-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Loader2, CheckCircle2, AlertCircle, GitBranch } from "lucide-react"
import type { GitHubRepo, RepoConfig } from "@/lib/types/repository"
import { DEFAULT_FILE_PATHS } from "@/lib/types/repository"

interface RepositorySetupModalProps {
  isOpen: boolean
  onClose: () => void
  onRepositoryConfigured: () => void
}

export function RepositorySetupModal({ 
  isOpen, 
  onClose, 
  onRepositoryConfigured 
}: RepositorySetupModalProps) {
  const { 
    availableRepos, 
    configuredRepos,
    fetchAvailableRepos,
    saveRepoConfig,
    testRepoConnection,
    isLoading,
    error 
  } = useRepositoryStore()

  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [paths, setPaths] = useState({
    contentFilePath: DEFAULT_FILE_PATHS.contentFilePath,
    productsFilePath: DEFAULT_FILE_PATHS.productsFilePath,
    tailwindConfigPath: DEFAULT_FILE_PATHS.tailwindConfigPath,
    brandLogoPath: DEFAULT_FILE_PATHS.brandLogoPath,
    brandAltLogoPath: DEFAULT_FILE_PATHS.brandAltLogoPath,
  })
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<{ status: string; results: any[]; message?: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAvailableRepos()
    }
  }, [isOpen, fetchAvailableRepos])

  useEffect(() => {
    if (selectedRepo) {
      setDisplayName(selectedRepo.repo)
    }
  }, [selectedRepo])

  const handleRepoSelect = (repoId: string) => {
    const repo = availableRepos.find(r => r.id === repoId)
    setSelectedRepo(repo || null)
    setTestResults(null)
  }

  const handleTestConnection = async () => {
    if (!selectedRepo) return

    setTesting(true)
    setTestResults(null)
    try {
      // For unconfigured repos, we need to pass owner/repo/branch
      // The test endpoint can work with unconfigured repos
      const results = await testRepoConnection(
        selectedRepo.id, 
        paths,
        {
          owner: selectedRepo.owner,
          repo: selectedRepo.repo,
          branch: selectedRepo.defaultBranch,
        }
      )
      setTestResults(results)
    } catch (error) {
      console.error('Error testing connection:', error)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRepo) return

    setSaving(true)
    try {
      const config: RepoConfig = {
        id: selectedRepo.id,
        owner: selectedRepo.owner,
        repo: selectedRepo.repo,
        defaultBranch: selectedRepo.defaultBranch,
        displayName: displayName || selectedRepo.repo,
        ...paths,
        isConfigured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await saveRepoConfig(config)
      onRepositoryConfigured()
      onClose()
      
      // Reset form
      setSelectedRepo(null)
      setDisplayName("")
      setPaths({
        contentFilePath: DEFAULT_FILE_PATHS.contentFilePath,
        productsFilePath: DEFAULT_FILE_PATHS.productsFilePath,
        tailwindConfigPath: DEFAULT_FILE_PATHS.tailwindConfigPath,
        brandLogoPath: DEFAULT_FILE_PATHS.brandLogoPath,
        brandAltLogoPath: DEFAULT_FILE_PATHS.brandAltLogoPath,
      })
      setTestResults(null)
    } catch (error) {
      console.error('Error saving repository config:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const configuredRepoIds = new Set(configuredRepos.map(r => r.id))
  const unconfiguredRepos = availableRepos.filter(r => !configuredRepoIds.has(r.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Configure Repository
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Select a repository and configure file paths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Repository Selection */}
            <div className="space-y-2">
              <Label htmlFor="repo-select">Repository</Label>
              <select
                id="repo-select"
                value={selectedRepo?.id || ""}
                onChange={(e) => handleRepoSelect(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-background-color px-3 py-2 text-sm"
              >
                <option value="">Select a repository...</option>
                {unconfiguredRepos.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.fullName} {repo.private ? "(Private)" : ""}
                  </option>
                ))}
              </select>
              {selectedRepo && (
                <div className="text-sm text-gray-600 mt-1">
                  Branch: <strong>{selectedRepo.defaultBranch}</strong>
                </div>
              )}
            </div>

            {selectedRepo && (
              <>
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={selectedRepo.repo}
                  />
                </div>

                {/* File Paths */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">File Paths</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content-file-path">Content File Path</Label>
                    <Input
                      id="content-file-path"
                      value={paths.contentFilePath}
                      onChange={(e) => setPaths({ ...paths, contentFilePath: e.target.value })}
                      placeholder="data/content.json"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="products-file-path">Products File Path</Label>
                    <Input
                      id="products-file-path"
                      value={paths.productsFilePath}
                      onChange={(e) => setPaths({ ...paths, productsFilePath: e.target.value })}
                      placeholder="data/intake-form/products.ts"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tailwind-config-path">Tailwind Config Path</Label>
                    <Input
                      id="tailwind-config-path"
                      value={paths.tailwindConfigPath}
                      onChange={(e) => setPaths({ ...paths, tailwindConfigPath: e.target.value })}
                      placeholder="tailwind.config.js"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand-logo-path">Brand Logo Path</Label>
                    <Input
                      id="brand-logo-path"
                      value={paths.brandLogoPath}
                      onChange={(e) => setPaths({ ...paths, brandLogoPath: e.target.value })}
                      placeholder="public/assets/images/brand/logo.svg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand-alt-logo-path">Brand Alt Logo Path</Label>
                    <Input
                      id="brand-alt-logo-path"
                      value={paths.brandAltLogoPath}
                      onChange={(e) => setPaths({ ...paths, brandAltLogoPath: e.target.value })}
                      placeholder="public/assets/images/brand/logo-alt.svg"
                    />
                  </div>
                </div>

                {/* Test Connection */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    variant="outline"
                    className="w-full"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>

                  {testResults && (
                    <div className={`p-3 rounded-md ${
                      testResults.status === "success" 
                        ? "bg-green-50 border border-green-200" 
                        : "bg-red-50 border border-red-200"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {testResults.status === "success" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          testResults.status === "success" ? "text-green-800" : "text-red-800"
                        }`}>
                          {testResults.message}
                        </span>
                      </div>
                      {testResults.results && testResults.results.length > 0 && (
                        <div className="space-y-1 text-xs">
                          {testResults.results.map((result, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              {result.exists ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-red-600" />
                              )}
                              <span className={result.exists ? "text-green-700" : "text-red-700"}>
                                {result.path}: {result.exists ? "Found" : result.error || "Not found"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving || testing}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Configuration"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

