"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageSelector } from "./shared/image-selector"
import { ColorInput } from "./shared/color-input"

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
          <ImageSelector
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
          <ImageSelector
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
          <ImageSelector
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
          <ImageSelector
            label="Source"
            value={value.src}
            onChange={(path) => onUpdate(["src"], path)}
            directory="public/assets/images/"
          />
        )}
        {value?.product && (
          <>
            <ImageSelector
              label="Product Image"
              value={typeof value.product === "string" ? value.product : value.product?.src || ""}
              onChange={(path) => {
                if (typeof value.product === "string") {
                  onUpdate(["product"], path)
                } else {
                  onUpdate(["product", "src"], path)
                }
              }}
              directory="public/assets/images/"
            />
            {value.product?.heights && (
              <div className="space-y-2">
                <Label>Heights</Label>
                <div className="grid grid-cols-2 gap-2">
                  {value.product.heights.mobile && (
                    <div className="space-y-1">
                      <Label className="text-xs">Mobile</Label>
                      <Input
                        value={value.product.heights.mobile}
                        onChange={(e) => onUpdate(["product", "heights", "mobile"], e.target.value)}
                        placeholder="e.g., 222px"
                      />
                    </div>
                  )}
                  {value.product.heights.desktop && (
                    <div className="space-y-1">
                      <Label className="text-xs">Desktop</Label>
                      <Input
                        value={value.product.heights.desktop}
                        onChange={(e) => onUpdate(["product", "heights", "desktop"], e.target.value)}
                        placeholder="e.g., auto"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        {value?.avatar && (
          <>
            <ImageSelector
              label="Avatar Image"
              value={typeof value.avatar === "string" ? value.avatar : value.avatar?.src || ""}
              onChange={(path) => {
                if (typeof value.avatar === "string") {
                  onUpdate(["avatar"], path)
                } else {
                  onUpdate(["avatar", "src"], path)
                }
              }}
              directory="public/assets/images/"
            />
            {value.avatar?.color && (
              <ColorInput
                label="Avatar Color"
                value={value.avatar.color}
                onChange={(color) => onUpdate(["avatar", "color"], color)}
              />
            )}
          </>
        )}
        {value?.star && (
          <>
            <ImageSelector
              label="Star Image"
              value={typeof value.star === "string" ? value.star : value.star?.src || ""}
              onChange={(path) => {
                if (typeof value.star === "string") {
                  onUpdate(["star"], path)
                } else {
                  onUpdate(["star", "src"], path)
                }
              }}
              directory="public/assets/images/"
            />
            {value.star?.color && (
              <ColorInput
                label="Star Color"
                value={value.star.color}
                onChange={(color) => onUpdate(["star", "color"], color)}
              />
            )}
          </>
        )}
        {value?.progressLine && (
          <ColorInput
            label="Progress Line Color"
            value={typeof value.progressLine === "string" ? value.progressLine : value.progressLine?.color || ""}
            onChange={(color) => {
              if (typeof value.progressLine === "string") {
                onUpdate(["progressLine"], color)
              } else {
                onUpdate(["progressLine", "color"], color)
              }
            }}
          />
        )}
        {value?.progressDots && (
          <ColorInput
            label="Progress Dots Color"
            value={typeof value.progressDots === "string" ? value.progressDots : value.progressDots?.color || ""}
            onChange={(color) => {
              if (typeof value.progressDots === "string") {
                onUpdate(["progressDots"], color)
              } else {
                onUpdate(["progressDots", "color"], color)
              }
            }}
          />
        )}
        {!value?.background && !value?.foreground && !value?.image && !value?.src && !value?.product && !value?.avatar && !value?.star && !value?.progressLine && !value?.progressDots && (
          <div className="text-sm text-muted-foreground">
            <p>No media properties found. This component may use a different structure.</p>
            <p className="mt-2">Available properties: {Object.keys(value || {}).join(", ") || "none"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

