"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { GlobalLayoutHeights } from "@/lib/types/branding"

interface LayoutHeightsEditorProps {
  heights: GlobalLayoutHeights
  onHeightsChange: (heights: GlobalLayoutHeights) => void
}

export function LayoutHeightsEditor({
  heights,
  onHeightsChange,
}: LayoutHeightsEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Layout Heights</CardTitle>
        <CardDescription>
          Global heights for navbar and footer (applies to all pages).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Navbar Heights */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Navbar Heights</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="navbar-mobile" className="text-xs">Mobile</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="navbar-mobile"
                    type="number"
                    value={heights.navbar.mobile}
                    onChange={(e) =>
                      onHeightsChange({
                        ...heights,
                        navbar: { ...heights.navbar, mobile: e.target.value },
                      })
                    }
                    placeholder="83"
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="navbar-desktop" className="text-xs">Desktop</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="navbar-desktop"
                    type="number"
                    value={heights.navbar.desktop}
                    onChange={(e) =>
                      onHeightsChange({
                        ...heights,
                        navbar: { ...heights.navbar, desktop: e.target.value },
                      })
                    }
                    placeholder="68"
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Heights */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Footer Heights</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="footer-mobile" className="text-xs">Mobile</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="footer-mobile"
                    type="number"
                    value={heights.footer.mobile}
                    onChange={(e) =>
                      onHeightsChange({
                        ...heights,
                        footer: { ...heights.footer, mobile: e.target.value },
                      })
                    }
                    placeholder="64"
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer-desktop" className="text-xs">Desktop</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="footer-desktop"
                    type="number"
                    value={heights.footer.desktop}
                    onChange={(e) =>
                      onHeightsChange({
                        ...heights,
                        footer: { ...heights.footer, desktop: e.target.value },
                      })
                    }
                    placeholder="72"
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}




