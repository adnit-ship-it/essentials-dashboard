"use client"

import { getImageSource, getArrayCount, normalizeTemplateName, hasImageSource } from "@/lib/utils/component-value-formatter"
import { ImagePreviewWithHover } from "./shared/image-preview-with-hover"
import { ColorMediaPreview } from "./color-media-preview"
import type { BasePreviewProps } from "./shared/preview-props"

export function MediaPreview({ componentKey, value, onClick, templateName, repoOwner, repoName, repoBranch }: BasePreviewProps) {
  const templateType = normalizeTemplateName(templateName ?? null)
  
  // Check if media object has any image sources
  const hasImages = hasImageSource(value, templateType)
  
  // If no images, show color preview instead
  if (!hasImages) {
    return (
      <ColorMediaPreview
        componentKey={componentKey}
        value={value}
        onClick={onClick}
        templateName={templateName}
        repoOwner={repoOwner}
        repoName={repoName}
        repoBranch={repoBranch}
      />
    )
  }
  
  // Otherwise, show image preview
  const imageSrc = getImageSource(value, templateType)
  const isArray = Array.isArray(value)
  const count = isArray ? value.length : 0
  const remainingCount = isArray && count > 0 ? count - 1 : 0

  const hoverText = remainingCount > 0
    ? `${remainingCount} more ${componentKey === "logos" ? "logos" : "images"}`
    : "Update Media"

  const fallbackText = isArray
    ? `${count} ${componentKey === "logos" ? "Logos" : "Images"}`
    : "No Image"

    console.log("value for media preview: ", value, imageSrc)
  return (
    <ImagePreviewWithHover
      imageSrc={imageSrc}
      alt={componentKey}
      onClick={onClick}
      hoverText={hoverText}
      fallbackText={fallbackText}
      repoOwner={repoOwner}
      repoName={repoName}
      repoBranch={repoBranch}
    />
  )
}
