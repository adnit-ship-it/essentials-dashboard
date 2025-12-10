"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ColorInput } from "./shared/color-input"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import type { Product } from "@/lib/types/products"

interface ProductCardEditorProps {
  componentKey: string
  value: any
  sectionName: string
  componentIndex: number
  onUpdate: (path: string[], value: any) => void
}

export function ProductCardEditor({ value, onUpdate }: ProductCardEditorProps) {
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Fetch products to show in dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      if (!repoOwnerFromLink || !repoNameFromLink) return

      setLoadingProducts(true)
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
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
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [repoOwnerFromLink, repoNameFromLink])

  // Sort products by order for dropdown
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER
      return orderA - orderB
    })
  }, [products])

  // Get all unique productBundleIds from products
  const availableBundleIds = useMemo(() => {
    const bundleIds = new Set<string>()
    products.forEach((product) => {
      if (product.productBundleIds) {
        Object.values(product.productBundleIds).forEach((id) => {
          if (id) bundleIds.add(id)
        })
      }
    })
    return Array.from(bundleIds).sort()
  }, [products])

  const productId = value?.productId || ""
  const productBundleId = value?.productBundleId || ""
  const button = value?.button || { text: "", type: "button", color: "accentColor1", show: true }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Product Card</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Product ID</Label>
          {loadingProducts ? (
            <Input value="Loading products..." disabled />
          ) : (
            <Select
              value={productId}
              onValueChange={(value) => {
                onUpdate(["productId"], value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {sortedProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {productId && (
            <p className="text-xs text-muted-foreground">
              Selected: {productId}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <div className="text-sm text-muted-foreground py-2 px-3 rounded-md border bg-muted/50">
            {value?.type || "product"}
          </div>
        </div>

        {button && (
          <div className="space-y-4 border rounded p-4">
            <Label className="text-sm font-medium">Button</Label>
            <div className="space-y-2">
              <Label>Text</Label>
              <Input
                value={button.text || ""}
                onChange={(e) =>
                  onUpdate(["button", "text"], e.target.value)
                }
                placeholder="Button text"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="text-sm text-muted-foreground py-2 px-3 rounded-md border bg-muted/50">
                {button.type || "button"}
              </div>
            </div>
            <ColorInput
              label="Color"
              value={button.color || "accentColor1"}
              onChange={(color) => onUpdate(["button", "color"], color)}
            />
            <div className="flex items-center justify-between">
              <Label>Show</Label>
              <Switch
                checked={button.show !== false}
                onCheckedChange={(checked) => onUpdate(["button", "show"], checked)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
