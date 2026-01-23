"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { LogoSizesEditorWrapper } from "../logo-sizes-editor-wrapper"

interface LogoSizesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoSizesModal({ open, onOpenChange }: LogoSizesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Logo Sizes</DialogTitle>
          <DialogDescription>
            Configure heights and widths for logos in different contexts.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <LogoSizesEditorWrapper isOpen={true} onToggle={() => {}} hideCard={true} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
