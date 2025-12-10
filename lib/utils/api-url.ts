/**
 * Get the API base URL for making requests
 * In the browser, uses relative URLs to avoid CORS issues
 * On the server, uses the configured API URL or localhost
 */
export function getApiBaseUrl(): string {
  // In the browser, use relative URLs (same origin, no CORS)
  if (typeof window !== "undefined") {
    return ""
  }
  
  // On the server, use the configured URL or localhost
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
}

