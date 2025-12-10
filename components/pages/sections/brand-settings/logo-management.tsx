"use client"

import { useState } from "react"
import { Upload, Undo2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { LogoState } from "@/lib/types/branding"
import { fileToPendingUpload } from "@/lib/utils/file-uploads"
import { normalizeRepoPathInput } from "@/lib/utils/repo-paths"
import { generateUniqueLogoFileName } from "@/lib/services/branding"

interface LogoManagementProps {
  logos: {
    primary: LogoState
    secondary: LogoState
    loadingScreen: LogoState
    favicon: LogoState
  }
  onLogoUpload: (type: "primary" | "secondary" | "loadingScreen" | "favicon", file: File) => Promise<void>
  onClearPending: (type: "primary" | "secondary" | "loadingScreen" | "favicon") => void
  repoOwner?: string
  repoName?: string
}

export function LogoManagement({
  logos,
  onLogoUpload,
  onClearPending,
  repoOwner,
  repoName,
}: LogoManagementProps) {
  const handleFileSelect = async (
    type: "primary" | "secondary" | "loadingScreen" | "favicon",
    file: File | null
  ) => {
    if (!file) return
    await onLogoUpload(type, file)
  }

  const logoConfigs = [
    { type: "primary" as const, label: "Primary Logo", description: "Main brand logo used in navbar" },
    { type: "secondary" as const, label: "Secondary Logo", description: "Alternate logo used in footer" },
    { type: "loadingScreen" as const, label: "Loading Screen Logo", description: "Logo shown during page load" },
    { type: "favicon" as const, label: "Favicon", description: "Browser tab icon" },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {logoConfigs.map((config) => {
        const logo = logos[config.type]
        if (!logo) {
          return null
        }
        const pending = logo.pendingUpload
        const preview = pending?.dataUrl || logo.url

        return (
          <Card key={config.type}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-sm">{config.label}</CardTitle>
                <CardDescription className="text-xs">{config.description}</CardDescription>
              </div>
              {pending && (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                  Pending
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
                {preview ? (
                  <img
                    src={preview}
                    alt={`${config.label} preview`}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                    <span>No image</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="break-all text-[10px]">{logo.path || "Path not configured"}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  id={`logo-upload-${config.type}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    if (file) {
                      void handleFileSelect(config.type, file)
                    }
                    e.target.value = ""
                  }}
                />
                <Button
                  type="button"
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <label
                    htmlFor={`logo-upload-${config.type}`}
                    className="flex cursor-pointer items-center gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    {pending ? "Replace" : "Upload"}
                  </label>
                </Button>
                {pending && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => onClearPending(config.type)}
                  >
                    <Undo2 className="mr-1 h-3 w-3" />
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

