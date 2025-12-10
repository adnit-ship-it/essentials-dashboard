/**
 * Shared utilities for handling file uploads
 */

export type PendingUpload = {
  base64: string
  dataUrl: string
  fileName: string
  mimeType: string
  fileSize: number
}

/**
 * Converts a File to a PendingUpload object with base64 encoding
 * @param file - The file to convert
 * @param defaultMimeType - Default MIME type if file.type is empty
 * @returns Promise resolving to PendingUpload
 */
export async function fileToPendingUpload(
  file: File,
  defaultMimeType: string = "image/svg+xml"
): Promise<PendingUpload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      if (!result.startsWith("data:")) {
        reject(new Error("Unsupported image format."))
        return
      }
      const [, base64Part] = result.split(",")
      if (!base64Part) {
        reject(new Error("Failed to read uploaded image."))
        return
      }
      resolve({
        base64: base64Part,
        dataUrl: result,
        fileName: file.name,
        mimeType: file.type || defaultMimeType,
        fileSize: file.size,
      })
    }
    reader.onerror = () => reject(new Error("Failed to read uploaded image."))
    reader.readAsDataURL(file)
  })
}





