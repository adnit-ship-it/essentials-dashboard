export interface UploadedFile {
  file: File
  preview: string
  type: 'logo' | 'alt-logo'
}

export async function uploadLogoToStorage(
  organizationId: string,
  file: File,
  type: 'logo' | 'alt-logo'
): Promise<string> {
  // Use server-side API for secure file upload
  const formData = new FormData()
  formData.append('file', file)
  formData.append('organizationId', organizationId)
  formData.append('type', type)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to upload file')
  }

  const data = await response.json()
  return data.url
}

export function createFilePreview(file: File): string {
  return URL.createObjectURL(file)
}

export function revokeFilePreview(preview: string): void {
  URL.revokeObjectURL(preview)
}