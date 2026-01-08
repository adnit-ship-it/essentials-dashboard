"use client"

import { FullQuiz } from "@/lib/types/quiz"
import { Button } from "@/components/ui/button"
import { Save, RotateCcw } from "lucide-react"
import { useFormLocalState } from "@/lib/hooks/use-form-local-state"
import { useQuizStore } from "@/lib/stores/quiz-store"
import { useState } from "react"
import { toast } from "sonner"

interface FormSidebarHeaderProps {
  quiz: FullQuiz
}

export function FormSidebarHeader({ quiz }: FormSidebarHeaderProps) {
  const localState = useFormLocalState({ quiz })
  const { isSaving } = useQuizStore()
  const [isSavingLocal, setIsSavingLocal] = useState(false)

  const handleSave = async () => {
    setIsSavingLocal(true)
    try {
      // Collect all changes
      const changes = localState.collectChanges()
      if (!changes) {
        toast.error("Unable to collect changes. Please refresh and try again.")
        return
      }

      // Log collected changes for debugging
      console.log("=== SAVE: Collected Changes ===")
      console.log("New Form Steps:", changes.newFormSteps.length, changes.newFormSteps)
      console.log("Added Template Steps:", changes.addedTemplateSteps.length, changes.addedTemplateSteps)
      console.log("Updated Form Steps:", changes.updatedFormSteps.length, changes.updatedFormSteps)
      console.log("Reorder Operations:", changes.reorderOperations.length, changes.reorderOperations)
      console.log("Deleted Form Step IDs:", changes.deletedFormStepIds.length, changes.deletedFormStepIds)
      console.log("New Progress Steps:", changes.newProgressSteps?.length || 0, changes.newProgressSteps)
      console.log("Updated Progress Steps:", changes.updatedProgressSteps?.length || 0, changes.updatedProgressSteps)
      console.log("Reorder Progress Operations:", changes.reorderProgressOperations?.length || 0, changes.reorderProgressOperations)
      console.log("Full Changes Object:", JSON.stringify(changes, null, 2))

      // Check if there are any changes to save
      const hasChanges =
        changes.newFormSteps.length > 0 ||
        changes.addedTemplateSteps.length > 0 ||
        changes.updatedFormSteps.length > 0 ||
        changes.reorderOperations.length > 0 ||
        changes.deletedFormStepIds.length > 0 ||
        (changes.newProgressSteps && changes.newProgressSteps.length > 0) ||
        (changes.updatedProgressSteps && changes.updatedProgressSteps.length > 0) ||
        (changes.reorderProgressOperations && changes.reorderProgressOperations.length > 0)

      console.log("Has Changes:", hasChanges)

      if (!hasChanges) {
        console.warn("No changes detected - aborting save")
        toast.info("No changes to save")
        return
      }

      // Save changes
      console.log("Saving changes...")
      await localState.saveChanges(changes)
      console.log("Save successful!")
      toast.success("Changes saved successfully")
      localState.resetChanges()
    } catch (error: any) {
      console.error("Error saving changes:", error)
      if (error.type === "conflict_error") {
        toast.error("Conflict: The quiz was modified by someone else. Please refresh and try again.")
      } else {
        toast.error(error.message || "Failed to save changes")
      }
    } finally {
      setIsSavingLocal(false)
    }
  }

  const handleReset = () => {
    localState.resetChanges()
    toast.info("Changes reset")
  }

  return (
    <div className="p-4 border-b space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{quiz.name}</h2>
      </div>
      {localState.hasUnsavedChanges && (
        <div className="text-xs text-muted-foreground mb-2">
          You have unsaved changes
        </div>
      )}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={isSaving || isSavingLocal || !localState.hasUnsavedChanges}
          size="sm"
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button
          onClick={handleReset}
          disabled={!localState.hasUnsavedChanges}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}




