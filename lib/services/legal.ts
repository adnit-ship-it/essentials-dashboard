/**
 * Legal pages service for fetching and saving data/legal.json
 */

import type { LegalData } from "@/lib/types/legal";

// Use relative URLs in browser to avoid CORS issues
const API_BASE_URL =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface LegalDataResponse {
  legal: LegalData;
  sha: string;
}

export type ErrorType =
  | "repo_not_found"
  | "file_not_found"
  | "permission_error"
  | "network_error"
  | "conflict_error"
  | "unknown_error";

export interface StructuredError extends Error {
  type: ErrorType;
  statusCode?: number;
  isConflict?: boolean;
}

/**
 * Fetches legal.json data from the API
 */
export async function fetchLegalData(
  owner: string,
  repo: string
): Promise<LegalDataResponse> {
  if (!owner || !repo) {
    throw new Error(
      "Repository owner/name missing. Configure via organization settings."
    );
  }

  const url = `${API_BASE_URL}/api/legal?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMessage =
      error.error ||
      `Failed to fetch legal data: ${response.status} ${response.statusText}`;

    let errorType: ErrorType = "unknown_error";
    if (response.status === 404) {
      // Check if it's a repo not found or file not found
      if (
        errorMessage.toLowerCase().includes("repository") ||
        errorMessage.toLowerCase().includes("not found")
      ) {
        errorType = "repo_not_found";
      } else {
        errorType = "file_not_found";
      }
    } else if (response.status === 403) {
      errorType = "permission_error";
    } else if (response.status >= 500) {
      errorType = "network_error";
    }

    const structuredError = new Error(errorMessage) as StructuredError;
    structuredError.type = errorType;
    structuredError.statusCode = response.status;
    throw structuredError;
  }

  const data = await response.json();
  return {
    legal: data.legal || { pages: [] },
    sha: data.sha || "",
  };
}

/**
 * Saves legal.json data to the API
 */
export async function saveLegalData(
  owner: string,
  repo: string,
  legal: LegalData,
  sha: string
): Promise<{ newSha: string; legal: LegalData }> {
  if (!owner || !repo) {
    throw new Error(
      "Repository owner/name missing. Configure via organization settings."
    );
  }

  if (!sha) {
    throw new Error("Missing legal file SHA. Refresh and try again.");
  }

  const url = `${API_BASE_URL}/api/legal?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      legal,
      sha,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    // Handle 409 Conflict specifically
    if (response.status === 409) {
      const conflictError = new Error(
        error.error ||
          "The legal file was modified by someone else. Please refresh and try again."
      ) as StructuredError;
      conflictError.isConflict = true;
      conflictError.type = "conflict_error";
      throw conflictError;
    }

    throw new Error(
      error.error ||
        `Failed to save legal data: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return {
    newSha: data.sha || sha,
    legal: data.legal || legal,
  };
}

/**
 * Upload an image for use in legal page content
 */
export async function uploadLegalImage(
  owner: string,
  repo: string,
  fileName: string,
  base64Content: string
): Promise<{ url: string; path: string; sha: string }> {
  if (!owner || !repo) {
    throw new Error(
      "Repository owner/name missing. Configure via organization settings."
    );
  }

  const path = `public/assets/images/legal/${fileName}`;
  const url = `${API_BASE_URL}/api/product-images?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path,
      contentBase64: base64Content,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error || `Failed to upload image: ${response.status}`
    );
  }

  const data = await response.json();
  return {
    url: data.fileUrl,
    path: data.path || path,
    sha: data.newSha,
  };
}
