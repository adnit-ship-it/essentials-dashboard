import { useMemo } from "react"

/**
 * Hook that generates a unique key based on data array to trigger animations on data changes
 * @param items - Array of items (can be any array)
 * @param getId - Optional function to extract ID from each item (default: uses item.id or index)
 * @returns A key string that changes when the array length or content changes
 */
export function useAnimationKey<T>(
  items: T[],
  getId?: (item: T, index: number) => string | number
): string {
  return useMemo(() => {
    if (!items || items.length === 0) {
      return `empty-${Date.now()}`
    }

    // Create a hash from array length and item IDs
    const ids = items.map((item, index) => {
      if (getId) {
        return getId(item, index)
      }
      // Try to get id from item, fallback to index
      return (item as any)?.id ?? (item as any)?.key ?? index
    })

    // Create a simple hash from the IDs
    const hash = ids.join("-")
    return `${items.length}-${hash}`
  }, [items, getId])
}

/**
 * Hook that generates a key from multiple data sources
 * Useful when you need to track changes across multiple arrays or values
 */
export function useAnimationKeyFromSources(
  ...sources: (string | number | any[] | null | undefined)[]
): string {
  return useMemo(() => {
    const parts = sources.map((source) => {
      if (Array.isArray(source)) {
        return `${source.length}-${source.map((item, i) => (item as any)?.id ?? i).join("-")}`
      }
      return String(source ?? "")
    })
    return parts.join("|")
  }, sources)
}
