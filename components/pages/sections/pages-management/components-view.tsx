"use client"

import { useState, useEffect } from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { findSectionInSections } from "@/lib/utils/pages-helpers"
import { getComponentEditors } from "./component-mapper"
import { SectionPreviewEditor } from "./component-editors/section-preview-editor"
import { ComponentPreviewCard } from "./component-preview-card"
import { ComponentEditModal } from "./component-edit-modal"
import { PreviewImageModal } from "./preview-image-modal"
import { useAnimationKey } from "@/lib/hooks/use-animation-key"
import { getStaggeredAnimationStyle } from "@/lib/utils/animation"
import { cn } from "@/lib/utils"
import {
  updateComponentNestedProperty,
  addArrayItem,
  removeArrayItem,
} from "@/lib/utils/pages-helpers"

export function ComponentsView() {
  const {
    pagesData,
    sectionsData,
    selectedPageKey,
    selectedSectionName,
    goBack,
    updateSectionsData,
  } = usePagesStore()
  
  const { repoOwnerFromLink, repoNameFromLink } = useOrganizationStore()
  const [templateName, setTemplateName] = useState<string | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<{
    key: string
    componentIndex: number
    componentKey: string
    value: any
    editorType: string
  } | null>(null)

  // Fetch template name from hostTemplate.json
  useEffect(() => {
    if (repoOwnerFromLink && repoNameFromLink) {
      // Use relative URL in browser (same origin, no CORS), or configured URL on server
      const apiUrl = typeof window !== "undefined" 
        ? "" // Relative URL in browser
        : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
      const url = `${apiUrl}/api/host-template?owner=${encodeURIComponent(repoOwnerFromLink)}&repo=${encodeURIComponent(repoNameFromLink)}`
      
      fetch(url)
        .then((res) => {
          if (res.ok) {
            return res.json()
          }
          if (res.status === 404) {
            return null // File doesn't exist yet
          }
          throw new Error(`Failed to fetch host template: ${res.status}`)
        })
        .then((data) => {
          if (data?.templateName) {
            setTemplateName(data.templateName)
          } else {
            setTemplateName(null)
          }
        })
        .catch((error) => {
          console.error("Error fetching host template:", error)
          setTemplateName(null)
        })
    }
  }, [repoOwnerFromLink, repoNameFromLink])

  if (!pagesData || !selectedPageKey || !selectedSectionName || !sectionsData) {
    goBack()
    return null
  }

  const page = pagesData[selectedPageKey] as any
  const section = findSectionInSections(sectionsData, selectedSectionName)

  // Generate animation key that changes when section components change
  const animationKey = useAnimationKey(
    section ? [section, ...section.components] : [],
    (item, index) => {
      if (index === 0) return `section-${selectedSectionName}`
      return `component-${index - 1}`
    }
  )

  if (!section) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Sections
        </Button>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Section "{selectedSectionName}" not found in sections data.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleComponentUpdate = (
    componentIndex: number,
    path: string[],
    value: any
  ) => {
    updateSectionsData((data) =>
      updateComponentNestedProperty(data, selectedSectionName, componentIndex, path, value)
    )
  }

  const handleArrayAdd = (
    componentIndex: number,
    arrayKey: string,
    item: any
  ) => {
    // Parse the array key
    // Direct array key (e.g., "logos", "steps", "faq")
    // Nested array key (e.g., "bulletPoints.items")
    const keys = arrayKey.split(".")
    const mainKey = keys[0]
    const subKey = keys[1]

    updateSectionsData((data) => {
      const sectionIndex = data.findIndex((s) => s.name === selectedSectionName)
      if (sectionIndex === -1) return data

      const updated = [...data]
      const section = { ...updated[sectionIndex] }
      const components = [...section.components]
      const component = { ...components[componentIndex] }

      if (subKey) {
        // Nested array (e.g., bulletPoints.items)
        const parent = component[mainKey] || {}
        const array = Array.isArray(parent[subKey]) ? [...parent[subKey]] : []
        component[mainKey] = { ...parent, [subKey]: [...array, item] }
      } else {
        // Direct array (e.g., logos, steps, faq)
        const array = Array.isArray(component[mainKey]) ? [...component[mainKey]] : []
        component[mainKey] = [...array, item]
      }

      components[componentIndex] = component
      section.components = components
      updated[sectionIndex] = section
      return updated
    })
  }

  const handleArrayRemove = (
    componentIndex: number,
    arrayKey: string,
    itemIndex: number
  ) => {
    const keys = arrayKey.split(".")
    const mainKey = keys[0]
    const subKey = keys[1]

    updateSectionsData((data) => {
      const sectionIndex = data.findIndex((s) => s.name === selectedSectionName)
      if (sectionIndex === -1) return data

      const updated = [...data]
      const section = { ...updated[sectionIndex] }
      const components = [...section.components]
      const component = { ...components[componentIndex] }

      if (subKey) {
        const parent = component[mainKey] || {}
        const array = Array.isArray(parent[subKey]) ? [...parent[subKey]] : []
        component[mainKey] = {
          ...parent,
          [subKey]: array.filter((_, i) => i !== itemIndex),
        }
      } else {
        const array = Array.isArray(component[mainKey]) ? [...component[mainKey]] : []
        component[mainKey] = array.filter((_, i) => i !== itemIndex)
      }

      components[componentIndex] = component
      section.components = components
      updated[sectionIndex] = section
      return updated
    })
  }

  const handleShowToggle = (componentIndex: number, componentKey: string, checked: boolean) => {
    // Get the current component value
    const component = section.components[componentIndex]
    const currentValue = component[componentKey]
    
    // Update the show property
    if (typeof currentValue === "object" && currentValue !== null && !Array.isArray(currentValue)) {
      handleComponentUpdate(componentIndex, [componentKey, "show"], checked)
    } else {
      // If value is not an object, wrap it in an object with show property
      handleComponentUpdate(componentIndex, [componentKey], { value: currentValue, show: checked })
    }
  }

  // Flatten all component editors into a single array
  const allEditors = section.components.flatMap((component, compIndex) =>
    getComponentEditors(
      component,
      compIndex,
      selectedSectionName,
      (path, value) => handleComponentUpdate(compIndex, path, value),
      (arrayKey, item) => handleArrayAdd(compIndex, arrayKey, item),
      (arrayKey, itemIndex) => handleArrayRemove(compIndex, arrayKey, itemIndex)
    )
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Sections
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-md font-medium">
            Editing: {selectedSectionName} (on {page.title})
          </h4>
          <p className="text-sm text-muted-foreground">
            {section.components.length} component
            {section.components.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Grid Layout: Preview card + Component preview cards */}
      <div
        key={animationKey}
        className="flex flex-wrap gap-4 justify-center"
      >
        {/* Section Preview - first item */}
        <div
          className={cn(
            "w-full md:w-[350px] lg:w-[300px] aspect-square animate-fade-in-staggered max-w-full"
          )}
          style={getStaggeredAnimationStyle(0)}
        >
          <SectionPreviewEditor
            sectionName={selectedSectionName}
            templateName={templateName}
            onExpandClick={() => setPreviewModalOpen(true)}
          />
        </div>

        {/* Component Preview Cards */}
        {allEditors.map((editor, index) => {
          const showValue =
            typeof editor.value === "object" &&
            editor.value !== null &&
            !Array.isArray(editor.value)
              ? editor.value.show !== false
              : true

          return (
            <div
              key={editor.key}
              className={cn(
                "w-full md:w-[350px] lg:w-[300px] aspect-square animate-fade-in-staggered max-w-full"
              )}
              style={getStaggeredAnimationStyle(index + 1)}
            >
              <ComponentPreviewCard
                componentKey={editor.componentKey}
                value={editor.value}
                componentIndex={editor.componentIndex}
                editorType={editor.editorType}
                onClick={() =>
                  setEditingComponent({
                    key: editor.key,
                    componentIndex: editor.componentIndex,
                    componentKey: editor.componentKey,
                    value: editor.value,
                    editorType: editor.editorType,
                  })
                }
                onShowToggle={(checked) =>
                  handleShowToggle(editor.componentIndex, editor.componentKey, checked)
                }
                show={showValue}
              />
            </div>
          )
        })}
      </div>

      {/* Preview Image Modal */}
      <PreviewImageModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        sectionName={selectedSectionName}
        templateName={templateName}
      />

      {/* Component Edit Modal */}
      {editingComponent && (
        <ComponentEditModal
          open={!!editingComponent}
          onOpenChange={(open) => {
            if (!open) {
              setEditingComponent(null)
            }
          }}
          componentKey={editingComponent.componentKey}
          value={editingComponent.value}
          componentIndex={editingComponent.componentIndex}
          sectionName={selectedSectionName}
          editorType={editingComponent.editorType as any}
          onSave={(path, value) => {
            if (path.length === 0) {
              // Updating the entire component value
              handleComponentUpdate(editingComponent.componentIndex, [editingComponent.componentKey], value)
            } else {
              // Updating nested properties
              handleComponentUpdate(editingComponent.componentIndex, [editingComponent.componentKey, ...path], value)
            }
            setEditingComponent(null)
          }}
          onArrayAdd={(arrayKey, item) => {
            handleArrayAdd(editingComponent.componentIndex, `${editingComponent.componentKey}.${arrayKey}`, item)
          }}
          onArrayRemove={(arrayKey, itemIndex) => {
            handleArrayRemove(editingComponent.componentIndex, `${editingComponent.componentKey}.${arrayKey}`, itemIndex)
          }}
        />
      )}
    </div>
  )
}

