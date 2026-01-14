"use client"

import { FullQuiz } from "@/lib/types/quiz"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface ProductBundleIdsEditorProps {
  quiz: FullQuiz
}

export function ProductBundleIdsEditor({ quiz }: ProductBundleIdsEditorProps) {
  const [productBundleIds, setProductBundleIds] = useState<string[]>(
    quiz.productBundleIds || []
  )
  const [inputValue, setInputValue] = useState("")

  const handleAdd = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !productBundleIds.includes(trimmed)) {
      setProductBundleIds([...productBundleIds, trimmed])
      setInputValue("")
    }
  }

  const handleRemove = (id: string) => {
    setProductBundleIds(productBundleIds.filter((pid) => pid !== id))
  }

  // TODO: Save changes to quiz
  const handleSave = () => {
    // Implement save functionality
    console.log("Save product bundle IDs:", productBundleIds)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter product bundle ID"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <Button type="button" onClick={handleAdd} variant="outline">
          Add
        </Button>
      </div>
      {productBundleIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {productBundleIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
            >
              {id}
              <button
                type="button"
                onClick={() => handleRemove(id)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {productBundleIds.length === 0 && (
        <p className="text-sm text-muted-foreground">No product bundle IDs</p>
      )}
    </div>
  )
}




