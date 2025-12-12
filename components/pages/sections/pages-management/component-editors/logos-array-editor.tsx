"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, X, ChevronDown } from "lucide-react"
import { LogoSelector } from "./shared/logo-selector"
import { cn } from "@/lib/utils"

interface LogosArrayEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

export function LogosArrayEditor({
  value,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: LogosArrayEditorProps) {
  const logos = Array.isArray(value) ? value : []
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null)

  // Expand newly added logos by default
  useEffect(() => {
    if (newlyAddedIndex !== null) {
      setExpanded((prev) => ({ ...prev, [newlyAddedIndex]: true }))
      setNewlyAddedIndex(null)
    }
  }, [newlyAddedIndex])

  const handleLogoUpdate = (index: number, field: "src" | "alt", newValue: string) => {
    const updated = [...logos]
    updated[index] = { ...updated[index], [field]: newValue }
    onUpdate([], updated)
  }

  const handleAddLogo = () => {
    // Add at the top (index 0) instead of at the end
    const newLogo = { src: "", alt: "" }
    if (onArrayAdd) {
      // Use onArrayAdd with a flag to add at top, but since we can't pass that,
      // we'll handle it directly via onUpdate
      const updated = [newLogo, ...logos]
      onUpdate([], updated)
      // Track the newly added index (which will be 0)
      setNewlyAddedIndex(0)
    } else {
      // Fallback: update directly
      const updated = [newLogo, ...logos]
      onUpdate([], updated)
      setNewlyAddedIndex(0)
    }
  }

  const toggleExpanded = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Logos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Logo Items</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddLogo}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Logo
          </Button>
        </div>
        <div className="space-y-4">
          {logos.map((logo: any, index: number) => {
            const isExpanded = expanded[index] ?? false
            return (
              <div key={index} className="border rounded p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                    onClick={() => toggleExpanded(index)}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded ? "rotate-180" : ""
                      )}
                    />
                    <Label className="text-sm font-medium cursor-pointer">Logo {index + 1}</Label>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onArrayRemove?.("", index)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                {isExpanded && (
                  <div className="space-y-3 pt-2 border-t">
                    <LogoSelector
                      label="Select from Registry"
                      value={logo?.src || ""}
                      onChange={(path) => handleLogoUpdate(index, "src", path)}
                    />
                    <div className="space-y-2">
                      <Label>Alt Text</Label>
                      <Input
                        value={logo?.alt || ""}
                        onChange={(e) => handleLogoUpdate(index, "alt", e.target.value)}
                        placeholder="Alt text"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

