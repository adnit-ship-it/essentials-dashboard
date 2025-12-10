import { NextRequest, NextResponse } from "next/server"

/**
 * Catch-all API route handler that proxies requests to the Express server
 * This allows Next.js to handle /api/* routes and forward them to the Express backend
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(req, params, "GET")
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(req, params, "POST")
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(req, params, "PUT")
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(req, params, "DELETE")
}

async function handleProxyRequest(
  req: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // Get the API base URL
    // In production, this should be set to the Express server URL
    // If not set, try to construct it from the current request (same origin, different port)
    let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    
    if (!apiBaseUrl) {
      // Calculate the Express server port
      // If SERVER_PORT is set, use it; otherwise use PORT-1 (Next.js uses PORT, Express uses PORT-1)
      const expressPort = process.env.SERVER_PORT || (process.env.PORT ? parseInt(process.env.PORT) - 1 : 3001)
      // Default to localhost with calculated port - works when both services run together
      // In production (Render), if both run in the same service, they can communicate via localhost
      apiBaseUrl = `http://localhost:${expressPort}`
    }
    
    // Reconstruct the full path
    const pathSegments = params.path || []
    const apiPath = `/api/${pathSegments.join("/")}`
    
    // Get query string from the original request
    const searchParams = req.nextUrl.searchParams.toString()
    const queryString = searchParams ? `?${searchParams}` : ""
    
    // Build the full URL
    const targetUrl = `${apiBaseUrl}${apiPath}${queryString}`
    
    // Get request body if it exists
    let body: string | undefined
    if (method !== "GET" && method !== "DELETE") {
      try {
        body = await req.text()
      } catch {
        // No body
      }
    }
    
    // Forward headers (excluding host and connection)
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host" && key.toLowerCase() !== "connection") {
        headers[key] = value
      }
    })
    
    // Make the request to the Express server
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    })
    
    // Get response data
    const data = await response.text()
    let jsonData: any
    try {
      jsonData = JSON.parse(data)
    } catch {
      jsonData = data
    }
    
    // Return the response with the same status code
    return NextResponse.json(jsonData, { status: response.status })
  } catch (error: any) {
    console.error(`Error proxying ${method} request:`, error)
    return NextResponse.json(
      { error: `Proxy failed: ${error.message}` },
      { status: 500 }
    )
  }
}

