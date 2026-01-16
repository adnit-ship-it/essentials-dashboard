/**
 * Product store for managing products.json data
 */

import { create } from "zustand"
import type { Product } from "@/lib/types/products"

interface ProductStore {
  products: Product[]
  sha: string | null
  isLoading: boolean
  
  // Actions
  setProducts: (products: Product[], sha: string | null) => void
  clearProducts: () => void
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  sha: null,
  isLoading: false,
  
  setProducts: (products, sha) => set({ products, sha }),
  clearProducts: () => set({ products: [], sha: null }),
}))
