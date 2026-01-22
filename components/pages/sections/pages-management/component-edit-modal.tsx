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
    onArrayAdd: onArrayAdd
      ? (arrayKey: string, item: any) => onArrayAdd(`${componentKey}.${arrayKey}`, item)
      : undefined,
    onArrayRemove: onArrayRemove
      ? (arrayKey: string, itemIndex: number) => onArrayRemove(`${componentKey}.${arrayKey}`, itemIndex)
      : undefined,
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
            onArrayAdd={onArrayAdd ? () => onArrayAdd(componentKey, { src: "", alt: "" }) : undefined}
            onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(componentKey, index) : undefined}
          />
        )
      case "steps":
        return (
          <StepsArrayEditor
            {...editorProps}
            onArrayAdd={onArrayAdd ? () => onArrayAdd(componentKey, { title: "", subtext: "", icon: { src: "", alt: "", type: "svg-image", color: "accentColor1" } }) : undefined}
            onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(componentKey, index) : undefined}
          />
        )
      case "faq":
        return (
          <FAQArrayEditor
            {...editorProps}
            onArrayAdd={onArrayAdd ? () => onArrayAdd(componentKey, { question: "", answer: "" }) : undefined}
            onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(componentKey, index) : undefined}
          />
        )
      case "before-after":
        return (
          <BeforeAfterArrayEditor
            {...editorProps}
            onArrayAdd={onArrayAdd ? (item: any) => onArrayAdd(componentKey, item) : undefined}
            onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(componentKey, index) : undefined}
          />
        )
      case "buttons":
        return (
          <ButtonsArrayEditor
            {...editorProps}
            onArrayAdd={onArrayAdd ? () => onArrayAdd(componentKey, { text: "", type: "button", color: "accentColor1", backgroundColor: "accentColor1", show: true }) : undefined}
            onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(componentKey, index) : undefined}
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
            onArrayAdd={onArrayAdd ? () => onArrayAdd(componentKey, { text: "", iconType: "checkmark-star", iconColor: "#AA992C" }) : undefined}
            onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(componentKey, index) : undefined}
          />
        )
      case "reviews":
        return (
          <ReviewsArrayEditor
            {...editorProps}
            onArrayAdd={onArrayAdd ? () => onArrayAdd(componentKey, { name: "", stars: 5, review: "", order: 1 }) : undefined}
            onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(componentKey, index) : undefined}
          />
        )
      case "statistics":
        return (
          <StatisticsArrayEditor
            {...editorProps}
            onArrayAdd={onArrayAdd ? () => onArrayAdd(componentKey, { value: "", description: "", order: 1, icon: { src: "", alt: "", type: "svg-image", color: "#337168" }, showBulletpoint: false }) : undefined}
            onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(componentKey, index) : undefined}
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
