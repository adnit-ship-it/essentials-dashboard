import { auth } from "@/lib/firebase/client"
import { getIdToken } from "firebase/auth"

export interface GraphQLRequestOptions<Vars = Record<string, any>> {
	endpoint?: string
	query: string
	variables?: Vars
	headers?: Record<string, string>
}

export async function fetchGraphQL<TData = any, TVars = Record<string, any>>(options: GraphQLRequestOptions<TVars>): Promise<TData> {
	const endpoint = options.endpoint || process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT
	if (!endpoint) {
		throw new Error("GraphQL endpoint is not configured. Set NEXT_PUBLIC_GRAPHQL_ENDPOINT.")
	}
	const defaultHeaders: Record<string, string> = {
		"Content-Type": "application/json",
	}
	// Prefer Firebase user token if available (client-side), else fall back to env token if provided
	let authTokenSnippet: string | null = null
	try {
		if (typeof window !== "undefined" && auth.currentUser) {
			const token = await getIdToken(auth.currentUser)
			if (token) {
				defaultHeaders["Authorization"] = `Bearer ${token}`
				authTokenSnippet = token.slice(0, 12) + "...(masked)"
			}
		} else if (process.env.NEXT_PUBLIC_GRAPHQL_TOKEN) {
			defaultHeaders["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_GRAPHQL_TOKEN}`
			const t = process.env.NEXT_PUBLIC_GRAPHQL_TOKEN
			authTokenSnippet = t ? t.slice(0, 12) + "...(masked)" : null
		}
	} catch {
		// Ignore token errors; request may still succeed if the API permits it
	}

	const shouldDebug = process.env.NEXT_PUBLIC_GRAPHQL_DEBUG === "true"
	if (shouldDebug) {
		// Avoid logging full tokens. Show only presence and a short masked prefix for debugging.
		// eslint-disable-next-line no-console
		console.groupCollapsed("[GraphQL] Request")
		// eslint-disable-next-line no-console
		console.log("Endpoint:", endpoint)
		// eslint-disable-next-line no-console
		console.log("Has Authorization:", Boolean(defaultHeaders["Authorization"]))
		// eslint-disable-next-line no-console
		console.log("Authorization snippet:", authTokenSnippet)
		// eslint-disable-next-line no-console
		console.log("Variables:", options.variables || {})
		// eslint-disable-next-line no-console
		console.log("Query:", options.query)
		// eslint-disable-next-line no-console
		console.groupEnd()
	}

	const res = await fetch(endpoint, {
		method: "POST",
		headers: { ...defaultHeaders, ...(options.headers || {}) },
		body: JSON.stringify({
			operationName: undefined,
			variables: options.variables || {},
			query: options.query,
		}),
	})
	if (!res.ok) {
		const text = await res.text().catch(() => "")
		throw new Error(`GraphQL request failed with ${res.status}: ${text}`)
	}
	const json = await res.json()

	if (shouldDebug) {
		// eslint-disable-next-line no-console
		console.groupCollapsed("[GraphQL] Response")
		// eslint-disable-next-line no-console
		console.log("OK:", res.ok, "Status:", res.status)
		// eslint-disable-next-line no-console
		console.log("Data keys:", json && typeof json === "object" ? Object.keys(json) : typeof json)
		// eslint-disable-next-line no-console
		console.log("Errors:", json?.errors || null)
		// eslint-disable-next-line no-console
		console.groupEnd()
	}

	if (json.errors && json.errors.length) {
		throw new Error(json.errors.map((e: any) => e.message).join("; "))
	}
	return json.data as TData
}


