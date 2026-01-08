"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuizStore } from "@/lib/stores/quiz-store"

export default function FormPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const quizId = searchParams.get("id")
  const { setBuilderQuizId, fetchQuizById } = useQuizStore()

  useEffect(() => {
    if (quizId) {
      setBuilderQuizId(quizId)
      fetchQuizById(quizId)
      // Redirect to home - FormsSection will detect builderQuizId and show builder
      // Note: User should manually navigate to Forms tab, or we could add logic
      // in dashboard layout to auto-switch to forms tab when builderQuizId is set
      router.replace("/")
    } else {
      router.replace("/")
    }
  }, [quizId, setBuilderQuizId, fetchQuizById, router])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to Forms...</p>
      </div>
    </div>
  )
}

