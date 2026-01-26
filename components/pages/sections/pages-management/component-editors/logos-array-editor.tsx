"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { LogoSelector } from "./shared/logo-selector"
import { ImageUpload } from "./shared/image-upload"

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
  const altInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleLogoUpdate = (index: number, field: "src" | "alt", newValue: string) => {
    const updated = [...logos]
    updated[index] = { ...updated[index], [field]: newValue }
    
    // Auto-populate alt text if it's empty and we're setting src
    if (field === "src" && !updated[index].alt && newValue) {
      // Extract filename from path and create a default alt text
      const filename = newValue.split('/').pop()?.split('.')[0] || "Logo"
      updated[index].alt = filename.charAt(0).toUpperCase() + filename.slice(1).replace(/[-_]/g, ' ')
    }
    
    onUpdate([], updated)
  }

  const handleAddLogo = () => {
    // Generate default alt text
    const defaultAlt = `Logo ${logos.length + 1}`
    onArrayAdd?.("", { src: "", alt: defaultAlt })
  }

  // Focus the last alt input when logos array grows
  useEffect(() => {
    if (logos.length > 0 && altInputRefs.current[logos.length - 1]) {
      setTimeout(() => {
        altInputRefs.current[logos.length - 1]?.focus()
      }, 100)
    }
  }, [logos.length])

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
          {logos.map((logo: any, index: number) => (
            <div key={index} className="border rounded p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Logo {index + 1}</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onArrayRemove?.("", index)}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <LogoSelector
                label="Select from Registry"
                value={logo?.src || ""}
                onChange={(path) => handleLogoUpdate(index, "src", path)}
              />
              <ImageUpload
                label="Upload from PC"
                value={logo?.src || ""}
                onChange={(path) => handleLogoUpdate(index, "src", path)}
                directory="public/assets/images/logos/"
              />
              <div className="space-y-2">
                <Label>Alt Text</Label>
                <Input
                  ref={(el) => {
                    altInputRefs.current[index] = el
                  }}
                  value={logo?.alt || ""}
                  onChange={(e) => handleLogoUpdate(index, "alt", e.target.value)}
                  placeholder="Alt text"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

