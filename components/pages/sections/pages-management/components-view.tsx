"use client"

import { useState, useEffect } from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePagesStore } from "@/lib/stores/pages-store"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { findSectionInSections } from "@/lib/utils/pages-helpers"
import { ComponentMapper } from "./component-mapper"
import { SectionPreviewEditor } from "./component-editors/section-preview-editor"
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

      {/* Section Preview and Component Editors in a flex layout */}
      <div className="flex flex-wrap gap-4 [&_[data-slot=card]]:py-4 [&_[data-slot=card]]:gap-4 [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-header]]:pb-3 [&_[data-slot=card-content]]:px-4">
        {/* Section Preview - shown once for the entire section */}
        <div className="w-full md:w-[calc(50%-0.5rem)] max-w-md">
          <SectionPreviewEditor sectionName={selectedSectionName} templateName={templateName} />
        </div>

        {/* Component Editors */}
        {section.components.map((component, index) => (
          <ComponentMapper
            key={index}
            component={component}
            componentIndex={index}
            sectionName={selectedSectionName}
            templateName={templateName}
            onUpdate={(path, value) => handleComponentUpdate(index, path, value)}
            onArrayAdd={(arrayKey, item) => handleArrayAdd(index, arrayKey, item)}
            onArrayRemove={(arrayKey, itemIndex) =>
              handleArrayRemove(index, arrayKey, itemIndex)
            }
          />
        ))}
      </div>
    </div>
  )
}

