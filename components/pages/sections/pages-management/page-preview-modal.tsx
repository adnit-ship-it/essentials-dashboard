"use client"

import { useState } from "react"
import { Loader2, Monitor, Tablet, Smartphone, ExternalLink, AlertCircle } from "lucide-react"
import { getPagePreviewImagePath } from "@/lib/utils/section-preview-images"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PagePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pageKey: string
  pageTitle: string
  hostedUrl: string | null
  templateName?: string | null
}

type DeviceSize = "mobile" | "tablet" | "desktop"

const deviceConfig: Record<DeviceSize, { width: string; icon: typeof Monitor; label: string }> = {
  mobile: { width: "375px", icon: Smartphone, label: "Mobile" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
}

export function PagePreviewModal({
  open,
  onOpenChange,
  pageKey,
  pageTitle,
  hostedUrl,
  templateName,
}: PagePreviewModalProps) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceSize>("desktop")
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const previewImagePath = getPagePreviewImagePath(pageKey, templateName ?? null)

  // Construct the page URL
  const getPageUrl = () => {
    if (!hostedUrl) return null
    // Home page uses root path, others use their key
    const pagePath = pageKey.toLowerCase() === "home" ? "" : pageKey.toLowerCase()
    // Ensure no double slashes
    const baseUrl = hostedUrl.endsWith("/") ? hostedUrl.slice(0, -1) : hostedUrl
    return pagePath ? `${baseUrl}/${pagePath}` : baseUrl
  }

  const pageUrl = getPageUrl()

  const handleIframeLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  // Reset loading state when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setIsLoading(true)
      setHasError(false)
    }
    onOpenChange(newOpen)
  }

  if (!hostedUrl) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview Not Available</DialogTitle>
            <DialogDescription>
              Host your site first to preview pages.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Click the "Host" button in the sidebar to deploy your site, then you can preview pages here.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{pageTitle}</DialogTitle>
              <DialogDescription className="mt-1">
                Preview how this page looks on different devices
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Device Size Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {(Object.keys(deviceConfig) as DeviceSize[]).map((device) => {
                  const { icon: Icon, label } = deviceConfig[device]
                  return (
                    <Button
                      key={device}
                      variant={selectedDevice === device ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-8 gap-1.5",
                        selectedDevice === device && "shadow-sm"
                      )}
                      onClick={() => setSelectedDevice(device)}
                      title={label}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </Button>
                  )
                })}
              </div>
              
              {/* Open in New Tab */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8"
                onClick={() => window.open(pageUrl!, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Open</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* iframe Container with preview image fallback */}
        <div className="flex-1 overflow-auto bg-muted/50 p-4">
          <div 
            className={cn(
              "mx-auto bg-background rounded-lg shadow-lg overflow-hidden transition-all duration-300 relative",
              selectedDevice !== "desktop" && "border"
            )}
            style={{ 
              width: deviceConfig[selectedDevice].width,
              maxWidth: "100%",
              height: selectedDevice === "desktop" ? "100%" : "calc(100% - 2rem)",
              minHeight: "500px",
            }}
          >
            {/* Preview image - shown while loading or as fallback when iframe fails */}
            {(isLoading || hasError) && previewImagePath && (
              <div className="absolute inset-0 z-0">
                <img
                  src={previewImagePath}
                  alt={`${pageTitle} preview`}
                  className="w-full h-full object-cover object-top"
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Loading live preview...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading state when no preview image */}
            {isLoading && !previewImagePath && (
              <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading preview...</p>
                </div>
              </div>
            )}

            {/* Error State - when iframe fails and we have preview image, show overlay with Open button */}
            {hasError && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="flex flex-col items-center gap-3 text-center px-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">
                    Live preview unavailable. The site may be blocking iframe embedding.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(pageUrl!, "_blank", "noopener,noreferrer")}
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}

            {/* Error state when no preview image */}
            {hasError && !isLoading && !previewImagePath && (
              <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                <div className="flex flex-col items-center gap-3 text-center px-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">
                    Failed to load preview. The site may be blocking iframe embedding.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(pageUrl!, "_blank", "noopener,noreferrer")}
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}

            {/* iframe - overlays when loaded */}
            <iframe
              src={pageUrl!}
              className={cn(
                "w-full h-full border-0 relative z-[1]",
                isLoading && "opacity-0"
              )}
              style={{ minHeight: "500px", height: "calc(95vh - 140px)" }}
              sandbox="allow-scripts allow-same-origin allow-forms"
              loading="lazy"
              referrerPolicy="no-referrer"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title={`Preview of ${pageTitle}`}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
