"use client"

import { useState } from "react"
import { useQuizStore } from "@/lib/stores/quiz-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface NewQuizModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NewQuizModal({ isOpen, onClose, onSuccess }: NewQuizModalProps) {
  const { createNewQuiz, isSaving } = useQuizStore()
  const { selectedOrgId } = useOrganizationStore()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [productBundleIds, setProductBundleIds] = useState<string[]>([])
  const [productBundleInput, setProductBundleInput] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Quiz name is required")
      return
    }

    if (!selectedOrgId) {
      toast.error("Please select an organization")
      return
    }

    try {
      await createNewQuiz({
        name: name.trim(),
        description: description.trim() || undefined,
        productBundleIds,
        organizationId: selectedOrgId,
      })

      toast.success("Quiz created successfully")
      setName("")
      setDescription("")
      setProductBundleIds([])
      setProductBundleInput("")
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create quiz")
    }
  }

  const handleAddProductBundle = () => {
    const trimmed = productBundleInput.trim()
    if (trimmed && !productBundleIds.includes(trimmed)) {
      setProductBundleIds([...productBundleIds, trimmed])
      setProductBundleInput("")
    }
  }

  const handleRemoveProductBundle = (id: string) => {
    setProductBundleIds(productBundleIds.filter((pid) => pid !== id))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Quiz</DialogTitle>
          <DialogDescription>
            Create a new quiz form for your website
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Quiz Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Health Assessment Quiz"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the quiz"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productBundles">Product Bundle IDs</Label>
            <div className="flex gap-2">
              <Input
                id="productBundles"
                value={productBundleInput}
                onChange={(e) => setProductBundleInput(e.target.value)}
                placeholder="Enter product bundle ID"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddProductBundle()
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddProductBundle}
                variant="outline"
              >
                Add
              </Button>
            </div>
            {productBundleIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {productBundleIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                  >
                    {id}
                    <button
                      type="button"
                      onClick={() => handleRemoveProductBundle(id)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Quiz
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}




