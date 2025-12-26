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
import { BooleanEditor } from "./component-editors/boolean-editor"
import { SimpleTextEditor } from "./component-editors/simple-text-editor"
import { BackgroundEditor } from "./component-editors/background-editor"
import { FeaturesArrayEditor } from "./component-editors/features-array-editor"
import { ReviewsArrayEditor } from "./component-editors/reviews-array-editor"
import { StatisticsArrayEditor } from "./component-editors/statistics-array-editor"
import { GenericEditor } from "./component-editors/generic-editor"

interface ComponentEditorProps {
  component: Component
  componentIndex: number
  sectionName: string
  templateName?: string | null
  onUpdate: (path: string[], value: any) => void
  onArrayAdd?: (arrayKey: string, item: any) => void
  onArrayRemove?: (arrayKey: string, itemIndex: number) => void
}

/**
 * Maps component keys to their appropriate editor components
 */
export function ComponentMapper({
  component,
  componentIndex,
  sectionName,
  templateName,
  onUpdate,
  onArrayAdd,
  onArrayRemove,
}: ComponentEditorProps) {
  // Get all keys in the component
  const keys = Object.keys(component)

  return (
    <div className="flex flex-wrap gap-4 [&_[data-slot=card]]:py-4 [&_[data-slot=card]]:gap-4 [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-header]]:pb-3 [&_[data-slot=card-content]]:px-4">
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
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><TextEditor {...editorProps} /></div>
        }

        if (
          key === "ctaButton" ||
          key === "button" ||
          key === "button1" ||
          key === "button2"
        ) {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><ButtonEditor {...editorProps} /></div>
        }

        if (key === "logo") {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><LogoEditor {...editorProps} /></div>
        }

        if (key === "media") {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><MediaEditor {...editorProps} /></div>
        }

        if (key === "bulletPoints") {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><BulletPointsEditor {...editorProps} /></div>
        }

        if (key === "logos") {
          return (
            <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]">
              <LogosArrayEditor
                {...editorProps}
                onArrayAdd={onArrayAdd ? () => onArrayAdd(key, { src: "", alt: "" }) : undefined}
                onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
              />
            </div>
          )
        }

        if (key === "steps") {
          return (
            <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]">
              <StepsArrayEditor
                {...editorProps}
                onArrayAdd={onArrayAdd ? () => onArrayAdd(key, { title: "", subtext: "", icon: { src: "", alt: "", type: "svg-image", color: "accentColor1" } }) : undefined}
                onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
              />
            </div>
          )
        }

        if (key === "faq") {
          return (
            <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]">
              <FAQArrayEditor
                {...editorProps}
                onArrayAdd={onArrayAdd ? () => onArrayAdd(key, { question: "", answer: "" }) : undefined}
                onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
              />
            </div>
          )
        }

        if (key === "before-after") {
          return (
            <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]">
              <BeforeAfterArrayEditor
                {...editorProps}
                onArrayAdd={onArrayAdd ? (item: any) => onArrayAdd(key, item) : undefined}
                onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
              />
            </div>
          )
        }

        if (key === "buttons") {
          return (
            <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]">
              <ButtonsArrayEditor
                {...editorProps}
                onArrayAdd={onArrayAdd ? () => onArrayAdd(key, { text: "", type: "button", color: "accentColor1", backgroundColor: "accentColor1", show: true }) : undefined}
                onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
              />
            </div>
          )
        }

        if (key === "marqueeSpeed") {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><NumberEditor {...editorProps} /></div>
        }

        if (key === "productCard") {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><ProductCardEditor {...editorProps} /></div>
        }

        if (key === "stats") {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><StatsEditor {...editorProps} /></div>
        }

        if (key === "infoCard") {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><InfoCardEditor {...editorProps} /></div>
        }

        if (key === "infoCard with bulletpoint") {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><InfoCardWithBulletpointsEditor {...editorProps} /></div>
        }

        if (key === "product-card-badge" || key === "title-bar") {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><BadgeEditor {...editorProps} /></div>
        }

        if (key === "features") {
          return (
            <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]">
              <FeaturesArrayEditor
                {...editorProps}
                onArrayAdd={onArrayAdd ? () => onArrayAdd(key, { text: "", iconType: "checkmark-star", iconColor: "#AA992C" }) : undefined}
                onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
              />
            </div>
          )
        }

        if (key === "reviews") {
          return (
            <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]">
              <ReviewsArrayEditor
                {...editorProps}
                onArrayAdd={onArrayAdd ? () => onArrayAdd(key, { name: "", stars: 5, review: "", order: 1 }) : undefined}
                onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
              />
            </div>
          )
        }

        if (key === "statistics") {
          return (
            <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]">
              <StatisticsArrayEditor
                {...editorProps}
                onArrayAdd={onArrayAdd ? () => onArrayAdd(key, { value: "", description: "", order: 1, icon: { src: "", alt: "", type: "svg-image", color: "#337168" }, showBulletpoint: false }) : undefined}
                onArrayRemove={onArrayRemove ? (_, index) => onArrayRemove(key, index) : undefined}
              />
            </div>
          )
        }

        if (key === "background") {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><BackgroundEditor {...editorProps} /></div>
        }

        if (key === "reverse" || key === "marqueePauseOnHover") {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><BooleanEditor {...editorProps} /></div>
        }

        if (key === "shippingInfo" || key === "providerText") {
          return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><SimpleTextEditor {...editorProps} /></div>
        }

        // Fallback to generic editor
        return <div key={reactKey} className="w-full md:w-[calc(50%-0.5rem)]"><GenericEditor {...editorProps} /></div>
      })}
    </div>
  )
}

