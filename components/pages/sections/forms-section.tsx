"use client"

import { useState, useEffect } from "react"
import { useQuizStore } from "@/lib/stores/quiz-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, AlertCircle, ChevronLeft, Link2 } from "lucide-react"
import { NewQuizModal } from "@/components/ui/new-quiz-modal"
import { QuizModal } from "@/components/ui/quiz-modal"
import { LinkProductModal } from "@/components/ui/link-product-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormPageContainer } from "@/components/pages/form/form-page-container"

export function FormsSection() {
  const {
    quizzes,
    isLoading,
    error,
    fetchQuizData,
    feedback,
    clearFeedback,
    currentView,
    builderQuizId,
    currentQuiz,
    setView,
    setBuilderQuizId,
    fetchQuizById,
  } = useQuizStore()

  const [newQuizModalOpen, setNewQuizModalOpen] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const [linkProductModalOpen, setLinkProductModalOpen] = useState(false)

  useEffect(() => {
    fetchQuizData()
  }, [fetchQuizData])

  useEffect(() => {
    if (feedback?.message) {
      const timer = setTimeout(() => {
        clearFeedback()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [feedback, clearFeedback])

  const handleQuizClick = (quizId: string) => {
    setSelectedQuizId(quizId)
  }

  const handleOpenBuilder = async (quizId: string) => {
    setBuilderQuizId(quizId)
    // Fetch the quiz if not already loaded or if it's a different quiz
    if (!currentQuiz || currentQuiz.id !== quizId) {
      await fetchQuizById(quizId)
    }
  }

  const handleBackToList = () => {
    setView("list")
    setBuilderQuizId(null)
  }

  const handleCreateSuccess = () => {
    setNewQuizModalOpen(false)
    fetchQuizData()
  }

  // Show form builder view
  if (currentView === "builder" && builderQuizId) {
    if (isLoading && !currentQuiz) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (currentQuiz) {
      return (
        <>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBackToList}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h3 className="text-lg font-medium">Form Builder</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentQuiz.name}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (currentQuiz?.id) {
                    setLinkProductModalOpen(true)
                  }
                }}
                className="gap-2"
              >
                <Link2 className="h-4 w-4" />
                Link to Product
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <FormPageContainer quiz={currentQuiz} />
            </div>
          </div>
          <LinkProductModal
            isOpen={linkProductModalOpen}
            onClose={() => setLinkProductModalOpen(false)}
            quizId={currentQuiz.id}
            onSuccess={() => {
              // Optionally refresh quiz data or show success message
              fetchQuizData()
            }}
          />
        </>
      )
    }
  }

  // Show quiz list view
  if (isLoading && currentView === "list") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && currentView === "list") {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error.message || "Failed to load quizzes. Please try again."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Forms</h3>
          <p className="text-sm text-muted-foreground">
            Manage quizzes and forms for your website
          </p>
        </div>
        <Button onClick={() => setNewQuizModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Form
        </Button>
      </div>

      {feedback?.message && (
        <Alert variant={feedback.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No quizzes found</p>
            <Button onClick={() => setNewQuizModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleQuizClick(quiz.id)}
            >
              <CardHeader>
                <CardTitle>{quiz.name}</CardTitle>
                <CardDescription>
                  {quiz.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Steps: {quiz.formSteps?.length || 0}</div>
                  <div>Version: {quiz.version}</div>
                  <div>
                  </div>
                </div>
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenBuilder(quiz.id)
                  }}
                >
                  Open Form Builder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewQuizModal
        isOpen={newQuizModalOpen}
        onClose={() => setNewQuizModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedQuizId && (
        <QuizModal
          quizId={selectedQuizId}
          isOpen={!!selectedQuizId}
          onClose={() => setSelectedQuizId(null)}
          onOpenBuilder={handleOpenBuilder}
        />
      )}
    </div>
  )
}
