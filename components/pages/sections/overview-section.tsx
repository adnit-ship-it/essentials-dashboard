"use client"

import { Palette, Layout, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { usePagesStore } from "@/lib/stores/pages-store"
import { cn } from "@/lib/utils"

interface OverviewSectionProps {
  onNavigate: (section: string) => void
}

export function OverviewSection({ onNavigate }: OverviewSectionProps) {
  const { repoNameFromLink } = useOrganizationStore()
  const hostTemplateInfo = usePagesStore((s) => s.hostTemplateInfo)

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Welcome to Essentials Dashboard</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your website content, brand settings, pages, and products from one place.
        </p>
      </div>

      {repoNameFromLink && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {repoNameFromLink && (
            <span>
              Repository: <span className="font-medium text-foreground">{repoNameFromLink}</span>
            </span>
          )}
          {hostTemplateInfo?.templateName && (
            <span>
              Template: <span className="font-medium text-foreground">{hostTemplateInfo.templateName}</span>
            </span>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="text-sm font-medium mb-3">Quick start</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="link"
            className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-foreground"
            onClick={() => onNavigate("brand-settings")}
          >
            Set page title and description
          </Button>
          <span className="text-muted-foreground">·</span>
          <Button
            variant="link"
            className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-foreground"
            onClick={() => onNavigate("brand-settings")}
          >
            Add your logos
          </Button>
          <span className="text-muted-foreground">·</span>
          <Button
            variant="link"
            className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-foreground"
            onClick={() => onNavigate("pages")}
          >
            Configure your home page
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className={cn(
            "cursor-pointer hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] transition-all duration-200"
          )}
          onClick={() => onNavigate("brand-settings")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Palette className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Brand Settings</CardTitle>
              <CardDescription>
                Set your page title, description, logos, colors, and announcement bar.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => onNavigate("brand-settings")}>
              Open Brand Settings
            </Button>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] transition-all duration-200"
          )}
          onClick={() => onNavigate("pages")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Layout className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Pages & Sections</CardTitle>
              <CardDescription>
                Configure your pages, sections, and component content.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => onNavigate("pages")}>
              Open Pages & Sections
            </Button>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] transition-all duration-200"
          )}
          onClick={() => onNavigate("products")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                Manage your product catalog and intake form.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => onNavigate("products")}>
              Open Products
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
