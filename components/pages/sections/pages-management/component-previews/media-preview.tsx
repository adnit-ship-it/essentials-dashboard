"use client"

import { getImageSource, getArrayCount, normalizeTemplateName } from "@/lib/utils/component-value-formatter"
import { ImagePreviewWithHover } from "./shared/image-preview-with-hover"
import type { BasePreviewProps } from "./shared/preview-props"

export function MediaPreview({ componentKey, value, onClick, templateName, repoOwner, repoName, repoBranch }: BasePreviewProps) {
  const templateType = normalizeTemplateName(templateName ?? null)
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
