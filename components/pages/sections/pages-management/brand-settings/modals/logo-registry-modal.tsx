"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { LogoRegistryView } from "../logo-registry-view"

interface LogoRegistryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoRegistryModal({ open, onOpenChange }: LogoRegistryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Logo Registry</DialogTitle>
          <DialogDescription>
            Manage logos that can be used across pages, sections, and layouts.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <LogoRegistryView isOpen={true} onToggle={() => {}} hideCard={true} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
