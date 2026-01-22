"use client"

import { useState, useEffect } from "react"
import { useBrandColors, resolveBrandColor, getTextColorForBackground } from "@/lib/utils/brand-colors"
import { convertContentRepoPathToRawUrl } from "@/lib/utils/repo-paths"
import type { BasePreviewProps } from "./shared/preview-props"
import type { Product } from "@/lib/types/products"

export function ProductCardPreview({
  componentKey,
  value,
  onClick,
  repoOwner,
  repoName,
  repoBranch = "main",
}: BasePreviewProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { colors: brandColors, loading: loadingBrandColors } = useBrandColors(repoOwner, repoName)

  // Extract productId and button from value
  const productId = value?.productId || null
  const button = value?.button || { text: "", type: "button", color: "accentColor1", show: true }

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!repoOwner || !repoName) return

      setLoadingProducts(true)
      try {
        const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
        const response = await fetch(
          `${API_BASE_URL}/api/products?owner=${encodeURIComponent(repoOwner)}&repo=${encodeURIComponent(repoName)}`
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
  }, [repoOwner, repoName])

  // Find product by ID
  const product = productId ? products.find((p) => p.id === productId) : null

  // Extract product image path
  const productImagePath = product?.img || null

  // Convert image path to GitHub raw URL
  const displayImageSrc = productImagePath
    ? convertContentRepoPathToRawUrl(productImagePath, repoOwner, repoName, repoBranch) || productImagePath
    : null

  // Resolve button color
  const buttonColor = button?.color || "accentColor1"
  const resolvedButtonColor = resolveBrandColor(buttonColor, brandColors)

  // Calculate text color for contrast
  const textColor = getTextColorForBackground(resolvedButtonColor, brandColors)

  // Button text
  const buttonText = button?.text || ""

  const handleImageError = () => {
    setImageError(true)
  }

  // Handle loading states
  if (loadingProducts || loadingBrandColors) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground text-center">
          Loading...
        </div>
      </div>
    )
  }

  // Handle no productId
  if (!productId) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-[2] flex items-center justify-center bg-muted rounded-t-md">
          <div className="text-sm text-muted-foreground text-center px-4">
            No product selected
          </div>
        </div>
        <div
          className="flex-[1] flex items-center justify-center rounded-b-md transition-opacity hover:opacity-90 cursor-pointer"
          onClick={onClick}
          style={{
            backgroundColor: resolvedButtonColor,
            color: textColor,
          }}
        >
          <span className="text-sm font-medium text-center px-4">
            {buttonText || "Button"}
          </span>
        </div>
      </div>
    )
  }

  // Handle product not found
  if (productId && !product) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-[2] flex items-center justify-center bg-muted rounded-t-md">
          <div className="text-sm text-muted-foreground text-center px-4">
            Product not found
          </div>
        </div>
        <div
          className="flex-[1] flex items-center justify-center rounded-b-md transition-opacity hover:opacity-90 cursor-pointer"
          onClick={onClick}
          style={{
            backgroundColor: resolvedButtonColor,
            color: textColor,
          }}
        >
          <span className="text-sm font-medium text-center px-4">
            {buttonText || "Button"}
          </span>
        </div>
      </div>
    )
  }

  // Render product card preview
  return (
    <div className="w-full h-full flex flex-col cursor-pointer" onClick={onClick}>
      {/* Image section - 2/3 height */}
      <div className="flex-[2] overflow-hidden rounded-t-md bg-muted flex items-center justify-center">
        {displayImageSrc && !imageError ? (
          <img
            src={displayImageSrc}
            alt={product?.name || "Product image"}
            className="w-full h-full object-contain"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="text-sm text-muted-foreground text-center px-4">
            {imageError ? "Image not found" : "No image"}
          </div>
        )}
      </div>

      {/* Colored strip section - 1/3 height */}
      <div
        className="flex-[1] flex items-center justify-center rounded-b-md transition-opacity hover:opacity-90"
        style={{
          backgroundColor: resolvedButtonColor,
          color: textColor,
        }}
      >
        <span className="text-sm font-medium text-center px-4">
          {buttonText || "Button"}
        </span>
      </div>
    </div>
  )
}
