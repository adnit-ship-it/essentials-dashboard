"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Info } from "lucide-react"
import type { FullQuiz } from "@/lib/types/quiz"
import type { Product } from "@/lib/types/products"
import { getProductsLinkedToQuiz, getProductBundleIdsFromProduct } from "@/lib/utils/product-quiz-linking"
import { useOrganizationStore } from "@/lib/stores/organization-store"

interface ProductLinksEditorProps {
  quiz: FullQuiz
}

export function ProductLinksEditor({ quiz }: ProductLinksEditorProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!repoOwnerFromLink || !repoNameFromLink) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
        const response = await fetch(
          `${API_BASE_URL}/api/products?owner=${encodeURIComponent(repoOwnerFromLink)}&repo=${encodeURIComponent(repoNameFromLink)}`
        )
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (err) {
        console.error("Failed to load products:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [repoOwnerFromLink, repoNameFromLink])

  const linkedProducts = useMemo(() => {
    return getProductsLinkedToQuiz(quiz.id, products)
  }, [quiz.id, products])

  const unlinkedProducts = useMemo(() => {
    return products.filter((product) => product.quiz !== quiz.id)
  }, [products, quiz.id])

  // Collect all bundle IDs from linked products
  const allBundleIds = useMemo(() => {
    const bundleIdsSet = new Set<string>()
    linkedProducts.forEach((product) => {
      const bundleIds = getProductBundleIdsFromProduct(product)
      bundleIds.forEach((id) => bundleIdsSet.add(id))
    })
    return Array.from(bundleIdsSet)
  }, [linkedProducts])

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {linkedProducts.length === 0 ? (
        <div className="text-center py-4 border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground mb-1">No products linked to this quiz</p>
          <p className="text-xs text-muted-foreground">
            Link products to this quiz from the Products section
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {linkedProducts.map((product) => {
            const bundleIds = getProductBundleIdsFromProduct(product)
            return (
              <div
                key={product.id}
                className="flex items-start justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{product.name}</span>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {product.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">ID: {product.id}</p>
                  {bundleIds.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Bundle IDs:</p>
                      <div className="flex flex-wrap gap-1">
                        {bundleIds.map((bundleId) => (
                          <span
                            key={bundleId}
                            className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
                          >
                            {bundleId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {linkedProducts.length > 0 && (
        <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Product Bundle IDs Synced</p>
            <p className="text-blue-700">
              The following bundle IDs from linked products are included in this quiz:{" "}
              {allBundleIds.length > 0 ? (
                <span className="font-mono">{allBundleIds.join(", ")}</span>
              ) : (
                <span>None</span>
              )}
            </p>
            <p className="text-blue-700 mt-1">
              To link/unlink products, go to the Products section and assign this quiz to products.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
