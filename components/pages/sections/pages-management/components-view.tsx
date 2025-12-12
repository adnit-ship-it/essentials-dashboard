"use client"

import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePagesStore } from "@/lib/stores/pages-store"
import { findSectionInSections } from "@/lib/utils/pages-helpers"
import { ComponentMapper, shouldUseCompactGrid } from "./component-mapper"
import {
  updateComponentNestedProperty,
  addArrayItem,
  removeArrayItem,
} from "@/lib/utils/pages-helpers"
import { cn } from "@/lib/utils"

/**
 * Maps section names to preview image paths
 */
function getSectionPreviewImage(sectionName: string): string | null {
  // Normalize section name: convert to lowercase, replace spaces with hyphens
  const normalized = sectionName.toLowerCase().trim().replace(/\s+/g, "-")
  
  // Map of section names to image file names
  const imageMap: Record<string, string> = {
    "home-results": "home-results.png",
    "home-products": "home-products.png",
    "home-faq": "home-faq.png",
    "about-hero": "about-hero.png",
    "products-hero": "products-hero.png",
    "about-stats": "about-stats.png",
    "home-hero": "home-hero.png",
    "home-discover": "home-discover.png",
    "home-journey": "home-journey.png",
    "home-form": "home-form.png",
    "before-after": "before-after.png",
    "trusted-by": "trusted-by.png",
    "contact-hero": "contact-hero.png",
  }
  
  // Try exact match first
  if (imageMap[normalized]) {
    return `/section-screenshots/${imageMap[normalized]}`
  }
  
  // Try partial match - check if normalized name contains any key or vice versa
  for (const [key, value] of Object.entries(imageMap)) {
    // Remove hyphens for more flexible matching
    const normalizedNoHyphens = normalized.replace(/-/g, "")
    const keyNoHyphens = key.replace(/-/g, "")
    
    if (
      normalized.includes(key) || 
      key.includes(normalized) ||
      normalizedNoHyphens.includes(keyNoHyphens) ||
      keyNoHyphens.includes(normalizedNoHyphens)
    ) {
      return `/section-screenshots/${value}`
    }
  }
  
  return null
}

export function ComponentsView() {
  const {
    pagesData,
    sectionsData,
    selectedPageKey,
    selectedSectionName,
    goBack,
    updateSectionsData,
  } = usePagesStore()

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
    item: any,
    addAtTop: boolean = false
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
        component[mainKey] = { ...parent, [subKey]: addAtTop ? [item, ...array] : [...array, item] }
      } else {
        // Direct array (e.g., logos, steps, faq)
        const array = Array.isArray(component[mainKey]) ? [...component[mainKey]] : []
        component[mainKey] = addAtTop ? [item, ...array] : [...array, item]
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

      <div className="space-y-6">
        {/* Preview Image - Show once at section level */}
        {(() => {
          const previewImage = getSectionPreviewImage(selectedSectionName)
          const useCompactGrid = shouldUseCompactGrid(selectedSectionName)
          
          if (!previewImage) {
            return null
          }
          
          return (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative w-full aspect-video bg-muted overflow-hidden">
                  <img
                    src={previewImage}
                    alt={`${selectedSectionName} preview`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })()}
        
        {/* Components */}
        {section.components.map((component, index) => (
          <div key={index}>
            <ComponentMapper
              component={component}
              componentIndex={index}
              sectionName={selectedSectionName}
              onUpdate={(path, value) => handleComponentUpdate(index, path, value)}
              onArrayAdd={(arrayKey, item) => handleArrayAdd(index, arrayKey, item)}
              onArrayRemove={(arrayKey, itemIndex) =>
                handleArrayRemove(index, arrayKey, itemIndex)
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

