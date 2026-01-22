"use client"

import { getImageSource, getArrayCount, normalizeTemplateName } from "@/lib/utils/component-value-formatter"
import { ImagePreviewWithHover } from "./shared/image-preview-with-hover"
import type { BasePreviewProps } from "./shared/preview-props"

export function BeforeAfterPreview({ value, onClick, templateName, repoOwner, repoName, repoBranch }: BasePreviewProps) {
  const templateType = normalizeTemplateName(templateName ?? null)
  const imageSrc = getImageSource(value, templateType)
  const count = getArrayCount(value)
  const remainingCount = count > 0 ? count - 1 : 0

  const hoverText = remainingCount > 0 ? `${remainingCount} more` : undefined
  const fallbackText = `${count} Before/After${count !== 1 ? "s" : ""}`

  return (
    <ImagePreviewWithHover
      imageSrc={imageSrc}
      alt="Before/After"
      onClick={onClick}
      hoverText={hoverText}
      fallbackText={fallbackText}
      repoOwner={repoOwner}
      repoName={repoName}
      repoBranch={repoBranch}
    />
  )
}
