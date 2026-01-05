"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitBranch, Sparkles, Plus, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EmptyStateViewProps {
  title?: string
  message?: string
  validationError?: string | null
  onCreateRepository?: () => void
  onConfigureRepository?: () => void
}

export function EmptyStateView({
  title,
  message,
  validationError,
  onCreateRepository,
  onConfigureRepository,
}: EmptyStateViewProps) {
  // Determine title and message based on validation error
  const displayTitle = title || (validationError 
    ? "Repository Not Found" 
    : "No repository selected")
  
  const displayMessage = message || (validationError
    ? "The linked repository has been deleted or doesn't exist. Please link a valid repository to continue."
    : "To get started, create a new repository or configure an existing one.")

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {validationError ? (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            ) : (
              <GitBranch className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <CardTitle>{displayTitle}</CardTitle>
          <CardDescription>{displayMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {validationError && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm text-destructive">
                {validationError}
              </AlertDescription>
            </Alert>
          )}
          {onCreateRepository && (
            <Button
              onClick={onCreateRepository}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {validationError ? "Fix Repository Link" : "Link Repository"}
            </Button>
          )}
          {/* {onConfigureRepository && (
            <Button
              onClick={onConfigureRepository}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Configure Repository
            </Button>
          )} */}
        </CardContent>
      </Card>
    </div>
  )
}

