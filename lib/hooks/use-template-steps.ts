/**
 * Hook for fetching and managing template steps
 */

import { useEffect, useState } from 'react'
import { useQuizStore } from '@/lib/stores/quiz-store'
import type { FormStep } from '@/lib/types/quiz'

// Use relative URLs in browser to avoid CORS issues
const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")

export function useTemplateSteps() {
  const { data } = useQuizStore()
  const [templates, setTemplates] = useState<FormStep[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // First try to get templates from store data
    if (data?.templates && data.templates.length > 0) {
      setTemplates(data.templates)
      return
    }

    // Otherwise fetch from API
    const fetchTemplates = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/api/form-steps/templates`)
        if (!response.ok) {
          throw new Error(`Failed to fetch templates: ${response.statusText}`)
        }

        const data = await response.json()
        setTemplates(data.templates || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch templates')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [data])

  return {
    templates,
    isLoading,
    error,
  }
}




