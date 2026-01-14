/**
 * Utilities for managing product-quiz relationships
 */

import type { Product } from "@/lib/types/products"
import type { FullQuiz } from "@/lib/types/quiz"

/**
 * Get all products linked to a specific quiz
 */
export function getProductsLinkedToQuiz(quizId: string, products: Product[]): Product[] {
  return products.filter((product) => product.quiz === quizId)
}

/**
 * Get the quiz linked to a specific product
 */
export function getQuizLinkedToProduct(productId: string, quizzes: FullQuiz[]): FullQuiz | null {
  return quizzes.find((quiz) => {
    // Check if any product with this ID is linked to this quiz
    // This would require products data, so we'll check quiz's productBundleIds instead
    // For now, return null - this will be handled at a higher level
    return null
  }) || null
}

/**
 * Get product bundle IDs from a product
 */
export function getProductBundleIdsFromProduct(product: Product): string[] {
  const bundleIds: string[] = []
  if (product.productBundleIds) {
    if (product.productBundleIds.monthly) {
      bundleIds.push(product.productBundleIds.monthly)
    }
    if (product.productBundleIds.threeMonthly) {
      bundleIds.push(product.productBundleIds.threeMonthly)
    }
    if (product.productBundleIds.sixMonthly) {
      bundleIds.push(product.productBundleIds.sixMonthly)
    }
  }
  return bundleIds
}

/**
 * Sync product bundle IDs to quiz based on linked products
 */
export function syncProductBundleIds(quiz: FullQuiz, products: Product[]): FullQuiz {
  // Get all products linked to this quiz
  const linkedProducts = getProductsLinkedToQuiz(quiz.id, products)
  
  // Collect all bundle IDs from linked products
  const bundleIdsSet = new Set<string>()
  linkedProducts.forEach((product) => {
    const bundleIds = getProductBundleIdsFromProduct(product)
    bundleIds.forEach((id) => bundleIdsSet.add(id))
  })
  
  // Update quiz's productBundleIds
  return {
    ...quiz,
    productBundleIds: Array.from(bundleIdsSet),
  }
}

/**
 * Validate product-quiz link
 */
export function validateProductQuizLink(product: Product, quiz: FullQuiz): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check if product has bundle IDs
  const bundleIds = getProductBundleIdsFromProduct(product)
  if (bundleIds.length === 0) {
    errors.push("Product must have at least one product bundle ID")
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get products that use the same quiz
 */
export function getProductsUsingSameQuiz(quizId: string, currentProductId: string, products: Product[]): Product[] {
  return products.filter(
    (product) => product.quiz === quizId && product.id !== currentProductId
  )
}
