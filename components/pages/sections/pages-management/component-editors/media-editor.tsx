"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "./shared/image-upload"

interface MediaEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

export function MediaEditor({ value, onUpdate }: MediaEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {value?.background && (
          <ImageUpload
            label="Background Image"
            value={typeof value.background === "string" ? value.background : value.background?.src || ""}
            onChange={(path) => {
              if (typeof value.background === "string") {
                onUpdate(["background"], path)
              } else {
                onUpdate(["background", "src"], path)
              }
            }}
            directory="public/assets/images/"
          />
        )}
        {value?.foreground && (
          <ImageUpload
            label="Foreground Image"
            value={typeof value.foreground === "string" ? value.foreground : value.foreground?.src || ""}
            onChange={(path) => {
              if (typeof value.foreground === "string") {
                onUpdate(["foreground"], path)
              } else {
                onUpdate(["foreground", "src"], path)
              }
            }}
            directory="public/assets/images/"
          />
        )}
        {value?.image && (
          <ImageUpload
            label="Image"
            value={typeof value.image === "string" ? value.image : value.image?.src || ""}
            onChange={(path) => {
              if (typeof value.image === "string") {
                onUpdate(["image"], path)
              } else {
                onUpdate(["image", "src"], path)
              }
            }}
            directory="public/assets/images/"
          />
        )}
        {value?.src && (
          <ImageUpload
            label="Source"
            value={value.src}
            onChange={(path) => onUpdate(["src"], path)}
            directory="public/assets/images/"
          />
        )}
        {!value?.background && !value?.foreground && !value?.image && !value?.src && (
          <div className="text-sm text-muted-foreground">
            <p>No media properties found. This component may use a different structure.</p>
            <p className="mt-2">Available properties: {Object.keys(value || {}).join(", ") || "none"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

