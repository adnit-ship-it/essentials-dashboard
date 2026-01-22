"use client"

import type { EditorType } from "../component-mapper"
import type { BasePreviewProps } from "./shared/preview-props"
import { TextButtonPreview } from "./text-button-preview"
import { ArrayCountPreview } from "./array-count-preview"
import { BulletPointsPreview } from "./bulletpoints-preview"
import { MediaPreview } from "./media-preview"
import { BeforeAfterPreview } from "./before-after-preview"
import { CardPreview } from "./card-preview"
import { InfoCardWithBulletpointsPreview } from "./info-card-with-bulletpoints-preview"
import { BackgroundPreview } from "./background-preview"
import { UIComponentPreview } from "./ui-component-preview"
import { SimplePreview } from "./simple-preview"
import { GenericPreview } from "./generic-preview"

type PreviewComponent = React.ComponentType<BasePreviewProps & { editorType?: EditorType }> | React.ComponentType<BasePreviewProps & { editorType: EditorType }>

/**
 * Type-safe registry mapping EditorType to preview components
 * Ensures all 24 EditorType values are handled
 */
export function getPreviewComponent(editorType: EditorType): React.ComponentType<BasePreviewProps & { editorType: EditorType }> {
  switch (editorType) {
    // Text/Button components
    case "text":
    case "button":
      return TextButtonPreview

    // Array count components
    case "buttons":
    case "steps":
    case "faq":
    case "features":
    case "reviews":
    case "statistics":
      return ArrayCountPreview

    // Bulletpoints component (enhanced preview)
    case "bulletPoints":
      return BulletPointsPreview

    // Media components
    case "logo":
    case "logos":
    case "media":
      return MediaPreview

    // Before-After component
    case "before-after":
      return BeforeAfterPreview

    // Card components
    case "productCard":
    case "infoCard":
    case "stats":
      return CardPreview

    // Info card with bulletpoints (enhanced preview)
    case "infoCardWithBulletpoints":
      return InfoCardWithBulletpointsPreview

    // UI components
    case "badge":
      return UIComponentPreview

    // Background component (full-color preview)
    case "background":
      return BackgroundPreview

    // Simple components
    case "number":
    case "boolean":
    case "simpleText":
      return SimplePreview as React.ComponentType<BasePreviewProps & { editorType: EditorType }>

    // Generic fallback
    case "generic":
      return GenericPreview

    default:
      // TypeScript exhaustive check - if a new EditorType is added, this will error
      const _exhaustive: never = editorType
      return GenericPreview
  }
}
