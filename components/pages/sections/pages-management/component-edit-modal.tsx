"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { EditorType } from "./component-mapper"
import { TextEditor } from "./component-editors/text-editor"
import { ButtonEditor } from "./component-editors/button-editor"
import { LogoEditor } from "./component-editors/logo-editor"
import { MediaEditor } from "./component-editors/media-editor"
import { BulletPointsEditor } from "./component-editors/bulletpoints-editor"
import { LogosArrayEditor } from "./component-editors/logos-array-editor"
import { StepsArrayEditor } from "./component-editors/steps-array-editor"
import { FAQArrayEditor } from "./component-editors/faq-array-editor"
import { BeforeAfterArrayEditor } from "./component-editors/beforeafter-array-editor"
import { ButtonsArrayEditor } from "./component-editors/buttons-array-editor"
import { NumberEditor } from "./component-editors/number-editor"
import { ProductCardEditor } from "./component-editors/product-card-editor"
import { StatsEditor } from "./component-editors/stats-editor"
import { InfoCardEditor } from "./component-editors/info-card-editor"
import { InfoCardWithBulletpointsEditor } from "./component-editors/info-card-with-bulletpoints-editor"
import { BadgeEditor } from "./component-editors/badge-editor"
import { BooleanEditor } from "./component-editors/boolean-editor"
import { SimpleTextEditor } from "./component-editors/simple-text-editor"
import { BackgroundEditor } from "./component-editors/background-editor"
import { FeaturesArrayEditor } from "./component-editors/features-array-editor"
import { ReviewsArrayEditor } from "./component-editors/reviews-array-editor"
import { StatisticsArrayEditor } from "./component-editors/statistics-array-editor"
import { GenericEditor } from "./component-editors/generic-editor"

interface ComponentEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  componentKey: string
  value: any
  componentIndex: number
  sectionName: string
  editorType: EditorType
  onSave: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

export function ComponentEditModal({
  open,
  onOpenChange,
  componentKey,
  value: initialValue,
  componentIndex,
  sectionName,
  editorType,
  onSave,
  onArrayAdd,
  onArrayRemove,
}: ComponentEditModalProps) {
  // Track temporary edits
  const [tempValue, setTempValue] = useState(initialValue)

  // Reset temp value when modal opens/closes or initial value changes
  useEffect(() => {
    if (open) {
      setTempValue(initialValue)
    }
  }, [open, initialValue])

  // Check for unsaved changes
  const hasUnsavedChanges = JSON.stringify(tempValue) !== JSON.stringify(initialValue)

  const handleUpdate = (path: string[], val: any) => {
    if (path.length === 0) {
      // Updating the entire value
      setTempValue(val)
    } else {
      // Updating a nested property
      const newValue = { ...tempValue }
      let current: any = newValue
      for (let i = 0; i < path.length - 1; i++) {
        if (current[path[i]] === undefined || typeof current[path[i]] !== "object") {
          current[path[i]] = {}
        }
        current = current[path[i]]
      }
      current[path[path.length - 1]] = val
      setTempValue(newValue)
    }
  }

  const handleArrayAddLocal = (arrayKey: string, item: any) => {
    if (arrayKey === "") {
      // Direct array - tempValue is the array itself
      const currentArray = Array.isArray(tempValue) ? tempValue : []
      setTempValue([...currentArray, item])
    } else {
      // Nested array - tempValue[arrayKey] is the array
      const currentArray = Array.isArray(tempValue?.[arrayKey]) ? tempValue[arrayKey] : []
      setTempValue({
        ...tempValue,
        [arrayKey]: [...currentArray, item]
      })
    }
  }

  const handleArrayRemoveLocal = (arrayKey: string, itemIndex: number) => {
    if (arrayKey === "") {
      // Direct array - tempValue is the array itself
      const currentArray = Array.isArray(tempValue) ? tempValue : []
      setTempValue(currentArray.filter((_, i) => i !== itemIndex))
    } else {
      // Nested array - tempValue[arrayKey] is the array
      const currentArray = Array.isArray(tempValue?.[arrayKey]) ? tempValue[arrayKey] : []
      setTempValue({
        ...tempValue,
        [arrayKey]: currentArray.filter((_, i) => i !== itemIndex)
      })
    }
  }

  const handleSave = () => {
    // Save the temporary value
    onSave([], tempValue)
    onOpenChange(false)
  }

  const handleCancel = () => {
    // Reset to initial value and close
    setTempValue(initialValue)
    onOpenChange(false)
  }

  const editorProps = {
    componentKey,
    value: tempValue,
    sectionName,
    componentIndex,
    onUpdate: handleUpdate,
    onArrayAdd: handleArrayAddLocal,
    onArrayRemove: handleArrayRemoveLocal,
  }

  const renderEditor = () => {
    switch (editorType) {
      case "text":
        return <TextEditor {...editorProps} />
      case "button":
        return <ButtonEditor {...editorProps} />
      case "logo":
        return <LogoEditor {...editorProps} />
      case "media":
        return <MediaEditor {...editorProps} />
      case "bulletPoints":
        return <BulletPointsEditor {...editorProps} />
      case "logos":
        return (
          <LogosArrayEditor
            {...editorProps}
            onArrayAdd={() => {
              const currentArray = Array.isArray(editorProps.value) ? editorProps.value : []
              handleArrayAddLocal("", { src: "", alt: `Logo ${currentArray.length + 1}` })
            }}
            onArrayRemove={(_, index) => handleArrayRemoveLocal("", index)}
          />
        )
      case "steps":
        return (
          <StepsArrayEditor
            {...editorProps}
            onArrayAdd={() => handleArrayAddLocal("", { title: "", subtext: "", icon: { src: "", alt: "", type: "svg-image", color: "accentColor1" } })}
            onArrayRemove={(_, index) => handleArrayRemoveLocal("", index)}
          />
        )
      case "faq":
        return (
          <FAQArrayEditor
            {...editorProps}
            onArrayAdd={() => handleArrayAddLocal("", { question: "", answer: "" })}
            onArrayRemove={(_, index) => handleArrayRemoveLocal("", index)}
          />
        )
      case "before-after":
        return (
          <BeforeAfterArrayEditor
            {...editorProps}
            onArrayAdd={(item: any) => handleArrayAddLocal("", item)}
            onArrayRemove={(_, index) => handleArrayRemoveLocal("", index)}
          />
        )
      case "buttons":
        return (
          <ButtonsArrayEditor
            {...editorProps}
            onArrayAdd={() => handleArrayAddLocal("", { text: "", type: "button", color: "accentColor1", backgroundColor: "accentColor1", show: true })}
            onArrayRemove={(_, index) => handleArrayRemoveLocal("", index)}
          />
        )
      case "number":
        return <NumberEditor {...editorProps} />
      case "productCard":
        return <ProductCardEditor {...editorProps} />
      case "stats":
        return <StatsEditor {...editorProps} />
      case "infoCard":
        return <InfoCardEditor {...editorProps} />
      case "infoCardWithBulletpoints":
        return <InfoCardWithBulletpointsEditor {...editorProps} />
      case "badge":
        return <BadgeEditor {...editorProps} />
      case "boolean":
        return <BooleanEditor {...editorProps} />
      case "simpleText":
        return <SimpleTextEditor {...editorProps} />
      case "background":
        return <BackgroundEditor {...editorProps} />
      case "features":
        return (
          <FeaturesArrayEditor
            {...editorProps}
            onArrayAdd={() => handleArrayAddLocal("", { text: "", iconType: "checkmark-star", iconColor: "#AA992C" })}
            onArrayRemove={(_, index) => handleArrayRemoveLocal("", index)}
          />
        )
      case "reviews":
        return (
          <ReviewsArrayEditor
            {...editorProps}
            onArrayAdd={() => handleArrayAddLocal("", { name: "", stars: 5, review: "", order: 1 })}
            onArrayRemove={(_, index) => handleArrayRemoveLocal("", index)}
          />
        )
      case "statistics":
        return (
          <StatisticsArrayEditor
            {...editorProps}
            onArrayAdd={() => handleArrayAddLocal("", { value: "", description: "", order: 1, icon: { src: "", alt: "", type: "svg-image", color: "#337168" }, showBulletpoint: false })}
            onArrayRemove={(_, index) => handleArrayRemoveLocal("", index)}
          />
        )
      case "generic":
      default:
        return <GenericEditor {...editorProps} />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        preventOutsideClick={hasUnsavedChanges}
      >
        <DialogHeader>
          <DialogTitle className="capitalize">
            Edit {componentKey.replace(/([A-Z])/g, " $1").replace(/-/g, " ")}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {renderEditor()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
