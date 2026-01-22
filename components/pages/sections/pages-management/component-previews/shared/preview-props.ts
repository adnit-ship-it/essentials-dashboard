/**
 * Shared props interface for all preview components
 */

export interface BasePreviewProps {
  componentKey: string
  value: any
  onClick: () => void
  templateName?: string | null
  repoOwner?: string | null
  repoName?: string | null
  repoBranch?: string
}
