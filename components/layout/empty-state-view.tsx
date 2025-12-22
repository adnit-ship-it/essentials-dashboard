"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitBranch, Sparkles, Plus } from "lucide-react"

interface EmptyStateViewProps {
  title?: string
  message?: string
  onCreateRepository?: () => void
  onConfigureRepository?: () => void
}

export function EmptyStateView({
  title = "No repository selected",
  message = "To get started, create a new repository or configure an existing one.",
  onCreateRepository,
  onConfigureRepository,
}: EmptyStateViewProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <GitBranch className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {onCreateRepository && (
            <Button
              onClick={onCreateRepository}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create Repository
            </Button>
          )}
          {onConfigureRepository && (
            <Button
              onClick={onConfigureRepository}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Configure Repository
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

