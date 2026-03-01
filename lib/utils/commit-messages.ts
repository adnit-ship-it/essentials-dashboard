/**
 * Helpers for generating descriptive commit messages.
 */

export function newPageMessage(title: string): string {
  return `New page: ${title}`
}

export function newSectionMessage(
  sectionName: string,
  pageTitle?: string
): string {
  if (pageTitle) {
    return `New section: ${sectionName} on ${pageTitle}`
  }
  return `New section: ${sectionName}`
}

export function propertyChangeMessage(
  sectionName: string,
  path: string,
  oldVal: string,
  newVal: string
): string {
  return `${sectionName} ${path}: '${oldVal}' -> '${newVal}'`
}

export function pagesUpdateMessage(): string {
  return "Pages update"
}

export function sectionsUpdateMessage(): string {
  return "Sections update"
}

export function commonUpdateMessage(): string {
  return "Common data update"
}

export function mediaUpdateMessage(): string {
  return "Media update"
}

export function deletePageMessage(title: string): string {
  return `Delete page: ${title}`
}

export function deleteSectionMessage(sectionName: string): string {
  return `Delete section: ${sectionName}`
}
