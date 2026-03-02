"use client"

import { Palette, Layout, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useRepoAppDataStore } from "@/lib/stores/repo-app-data-store"
import { cn } from "@/lib/utils"

interface OverviewSectionProps {
  onNavigate: (section: string) => void
}

export function OverviewSection({ onNavigate }: OverviewSectionProps) {
  const { repoNameFromLink } = useOrganizationStore()
  const hostTemplateInfo = useRepoAppDataStore((s) => s.hostTemplateInfo)

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Welcome to Essentials Dashboard</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This is your central hub for managing your website. Use the cards below to jump into Brand Settings, Pages & Sections, or Products—or follow the Quick start steps to get up and running.
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
          {hostTemplateInfo?.hostedAt && (
            <span>
              Preview at:{" "}
              <a
                href={hostTemplateInfo.hostedAt}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                {hostTemplateInfo.hostedAt.replace(/^https?:\/\//, "")}
              </a>
            </span>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="text-sm font-medium mb-3">Quick start</h4>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li>
            <Button
              variant="link"
              className="h-auto p-0 text-sm font-medium text-foreground hover:underline"
              onClick={() => onNavigate("brand-settings")}
            >
              Set page title and description
            </Button>
            <span className="block mt-0.5 pl-0">
              Define your site&apos;s title and meta description in Brand Settings so search engines and visitors see the right information.
            </span>
          </li>
          <li>
            <Button
              variant="link"
              className="h-auto p-0 text-sm font-medium text-foreground hover:underline"
              onClick={() => onNavigate("brand-settings")}
            >
              Add your logos
            </Button>
            <span className="block mt-0.5 pl-0">
              Upload your primary and secondary logos in Brand Settings. These appear in the header, footer, and loading screens.
            </span>
          </li>
          <li>
            <Button
              variant="link"
              className="h-auto p-0 text-sm font-medium text-foreground hover:underline"
              onClick={() => onNavigate("pages")}
            >
              Configure your home page
            </Button>
            <span className="block mt-0.5 pl-0">
              In Pages & Sections, choose which sections appear on your home page and customize their content.
            </span>
          </li>
        </ul>
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
                Set your page title, description, logos, colors, and announcement bar. Changes apply site-wide and affect SEO.
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
                Configure your pages, sections, and component content. Reorder sections and edit component content for each page.
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
                Manage your product catalog and intake form configuration.
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
