"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search, Check } from "lucide-react"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useProductStore } from "@/lib/stores/product-store"
import type { Product } from "@/lib/types/products"
import { cn } from "@/lib/utils"

interface LinkProductModalProps {
  isOpen: boolean
  onClose: () => void
  quizSlug: string
  onSuccess?: () => void
}

export function LinkProductModal({
  isOpen,
  onClose,
  quizSlug,
  onSuccess,
}: LinkProductModalProps) {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const { products: storeProducts, sha: storeSha, setProducts: setProductStoreProducts } = useProductStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [sha, setSha] = useState<string | null>(null)

  const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")

  // Use products from store if available, otherwise fetch
  useEffect(() => {
    if (isOpen) {
      if (storeProducts.length > 0 && storeSha) {
        // Use products from store
        setProducts(storeProducts)
        setSha(storeSha)
        
        // Pre-select products that already have this quiz assigned (by slug)
        const preSelected = new Set<string>()
        storeProducts.forEach((product: Product) => {
          if (product.quiz === quizSlug) {
            preSelected.add(product.id)
          }
        })
        setSelectedProductIds(preSelected)
      } else {
        // Fetch products if not in store
        fetchProducts()
      }
    } else {
      // Reset state when modal closes (but keep products and sha for next open)
      setSelectedProductIds(new Set())
      setSearchQuery("")
      setError(null)
    }
  }, [isOpen, storeProducts, storeSha, quizSlug])

  const fetchProducts = async () => {
    const owner = repoOwnerFromLink || ""
    const repo = repoNameFromLink || ""
    if (!owner || !repo) {
      setError("Repository owner/name missing. Configure via organization settings.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const url = `${API_BASE_URL}/api/products?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch products: ${response.status}`)
      }

      const data = await response.json()
      const fetchedProducts = data.products || []
      const fetchedSha = data.sha || null
      setProducts(fetchedProducts)
      setSha(fetchedSha)
      
      // Update product store with fetched products
      setProductStoreProducts(fetchedProducts, fetchedSha)
      
      // Pre-select products that already have this quiz assigned (by slug)
      const preSelected = new Set<string>()
      fetchedProducts.forEach((product: Product) => {
        if (product.quiz === quizSlug) {
          preSelected.add(product.id)
        }
      })
      setSelectedProductIds(preSelected)
    } catch (err) {
      console.error("Failed to fetch products:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!sha) {
      setError("Missing SHA for products file. Please refresh and try again.")
      return
    }

    if (selectedProductIds.size === 0) {
      setError("Please select at least one product.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const owner = repoOwnerFromLink || ""
      const repo = repoNameFromLink || ""
      
      // Update products: set quiz field (slug) for selected products, clear for others
      const updatedProducts = products.map((product) => ({
        ...product,
        quiz: selectedProductIds.has(product.id) ? quizSlug : (product.quiz === quizSlug ? null : product.quiz),
      }))

      const url = `${API_BASE_URL}/api/products?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: updatedProducts,
          sha,
          commitMessage: `CMS: Link quiz to ${selectedProductIds.size} product(s) (${new Date().toISOString()})`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to save products: ${response.status}`)
      }

      const result = await response.json()
      const newSha = result.newSha || result.sha || sha
      setSha(newSha)
      
      // Update product store with the updated products and new SHA
      setProductStoreProducts(updatedProducts, newSha)
      
      // Update local products state so if modal stays open, it shows updated data
      setProducts(updatedProducts)
      
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error("Failed to save products:", err)
      setError(err instanceof Error ? err.message : "Failed to save products")
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Quiz to Products</DialogTitle>
          <DialogDescription>
            Select products to link with this quiz. Products will show this quiz after checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            /* Products List */
            <div className="flex-1 overflow-y-auto border rounded-md">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {searchQuery ? "No products found matching your search." : "No products available."}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedProductIds.has(product.id)
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleToggleProduct(product.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-4 text-left hover:bg-accent transition-colors",
                          isSelected && "bg-accent/50"
                        )}
                      >
                        <div className={cn(
                          "flex-shrink-0 w-5 h-5 border-2 rounded flex items-center justify-center",
                          isSelected ? "border-primary bg-primary" : "border-gray-300"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {product.id}
                          </div>
                          {product.quiz && product.quiz !== quizSlug && (
                            <div className="text-xs text-amber-600 mt-1">
                              Currently linked to: {product.quiz}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedProductIds.size} product{selectedProductIds.size !== 1 ? "s" : ""} selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || loading || selectedProductIds.size === 0}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Link Products"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
