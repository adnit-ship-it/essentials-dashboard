/**
 * Component mapper - routes component keys to appropriate editors
 */

import type { Component } from "@/lib/types/sections"
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
import { GenericEditor } from "./component-editors/generic-editor"
import { cn } from "@/lib/utils"

interface ComponentEditorProps {
  component: Component
  componentIndex: number
  sectionName: string
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

/**
 * Determines if a section should use compact grid layout
 */
export function shouldUseCompactGrid(sectionName: string): boolean {
  const compactSections = [
    "home results",
    "home products",
    "home faq",
    "about hero",
    "products hero",
    "about stats",
  ]
  
  const normalized = sectionName.toLowerCase().trim()
  const normalizedNoSpaces = normalized.replace(/\s+/g, "")
  
  return compactSections.some((section) => {
    const sectionNormalized = section.toLowerCase().trim()
    const sectionNoSpaces = sectionNormalized.replace(/\s+/g, "")
    return (
      normalized.includes(sectionNormalized) ||
      sectionNormalized.includes(normalized) ||
      normalizedNoSpaces.includes(sectionNoSpaces) ||
      sectionNoSpaces.includes(normalizedNoSpaces)
    )
  })
}

/**
 * Maps component keys to their appropriate editor components
 */
export function ComponentMapper({
  component,
  componentIndex,
  sectionName,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: ComponentEditorProps) {
  // Get all keys in the component
  const keys = Object.keys(component)
  const useCompactGrid = shouldUseCompactGrid(sectionName)
  
  // Determine grid columns based on section type
  const gridCols = useCompactGrid 
    ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-4" 
    : "grid-cols-1 md:grid-cols-2"

  return (
    <div className={cn("grid gap-4", gridCols, "[&_[data-slot=card]]:py-4 [&_[data-slot=card]]:gap-4 [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-header]]:pb-3 [&_[data-slot=card-content]]:px-4")}>
      {keys.map((key) => {
        const value = component[key]
        const reactKey = `${componentIndex}-${key}`
        const editorProps = {
          componentKey: key,
          value,
          sectionName,
          componentIndex,
          onUpdate: (path: string[], val: any) => onUpdate([key, ...path], val),
          onArrayAdd: onArrayAdd
            ? (arrayKey: string, item: any) =>
                onArrayAdd(`${key}.${arrayKey}`, item)
            : undefined,
          onArrayRemove: onArrayRemove
            ? (arrayKey: string, itemIndex: number) =>
                onArrayRemove(`${key}.${arrayKey}`, itemIndex)
            : undefined,
        }

        // Route to appropriate editor based on key
        if (key === "heading" || key === "subheading" || key === "paragraph") {
          return <TextEditor key={reactKey} {...editorProps} />
        }

        if (
          key === "ctaButton" ||
          key === "button" ||
          key === "button1" ||
          key === "button2"
        ) {
          return <ButtonEditor key={reactKey} {...editorProps} />
        }

        if (key === "logo") {
          return <LogoEditor key={reactKey} {...editorProps} />
        }

        if (key === "media") {
          return <MediaEditor key={reactKey} {...editorProps} />
        }

        if (key === "bulletPoints") {
          return <BulletPointsEditor key={reactKey} {...editorProps} />
        }

        if (key === "logos") {
          return (
            <LogosArrayEditor
              key={reactKey}
              {...editorProps}
              onArrayAdd={undefined}
              onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
            />
          )
        }

        if (key === "steps") {
          return (
            <StepsArrayEditor
              key={reactKey}
              {...editorProps}
              onArrayAdd={onArrayAdd ? () => onArrayAdd(key, { title: "", subtext: "", icon: { src: "", alt: "", type: "svg-image", color: "accentColor1" } }) : undefined}
              onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
            />
          )
        }

        if (key === "faq") {
          return (
            <FAQArrayEditor
              key={reactKey}
              {...editorProps}
              onArrayAdd={onArrayAdd ? () => onArrayAdd(key, { question: "", answer: "" }) : undefined}
              onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
            />
          )
        }

        if (key === "before-after") {
          return (
            <BeforeAfterArrayEditor
              key={reactKey}
              {...editorProps}
              onArrayAdd={onArrayAdd ? (item: any) => onArrayAdd(key, item) : undefined}
              onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
            />
          )
        }

        if (key === "buttons") {
          return (
            <ButtonsArrayEditor
              key={reactKey}
              {...editorProps}
              onArrayAdd={onArrayAdd ? () => onArrayAdd(key, { text: "", type: "button", color: "accentColor1", backgroundColor: "accentColor1", show: true }) : undefined}
              onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
            />
          )
        }

        if (key === "marqueeSpeed") {
          return <NumberEditor key={reactKey} {...editorProps} />
        }

        if (key === "productCard") {
          return <ProductCardEditor key={reactKey} {...editorProps} />
        }

        if (key === "stats") {
          return <StatsEditor key={reactKey} {...editorProps} />
        }

        if (key === "infoCard") {
          return <InfoCardEditor key={reactKey} {...editorProps} />
        }

        if (key === "infoCard with bulletpoint") {
          return <InfoCardWithBulletpointsEditor key={reactKey} {...editorProps} />
        }

        if (key === "product-card-badge" || key === "title-bar") {
          return <BadgeEditor key={reactKey} {...editorProps} />
        }

        // Fallback to generic editor
        return <GenericEditor key={reactKey} {...editorProps} />
      })}
    </div>
  )
}

