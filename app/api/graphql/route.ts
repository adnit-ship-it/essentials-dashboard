import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT || process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT
    if (!graphqlEndpoint) {
      return NextResponse.json(
        { error: "GraphQL endpoint is not configured. Set GRAPHQL_ENDPOINT or NEXT_PUBLIC_GRAPHQL_ENDPOINT." },
        { status: 500 }
      )
    }

    // Get the request body
    const body = await req.json()

    // Forward the authorization header from the client request
    const authHeader = req.headers.get("authorization")
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (authHeader) {
      headers["Authorization"] = authHeader
    } else if (process.env.GRAPHQL_TOKEN || process.env.NEXT_PUBLIC_GRAPHQL_TOKEN) {
      // Fallback to env token if no auth header from client
      headers["Authorization"] = `Bearer ${process.env.GRAPHQL_TOKEN || process.env.NEXT_PUBLIC_GRAPHQL_TOKEN}`
    }

    // Forward the GraphQL request to the actual endpoint
    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    const data = await response.json()

    // Forward the status code and response
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("GraphQL proxy error:", error)
    return NextResponse.json(
      { error: `GraphQL proxy failed: ${error.message}` },
      { status: 500 }
    )
  }
}

