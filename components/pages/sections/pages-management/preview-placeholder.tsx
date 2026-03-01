"use client"

interface PreviewPlaceholderProps {
  variant?: "page" | "section"
  className?: string
}

/**
 * Wireframe-style placeholder shown when a page or section has no screenshot.
 * Visually suggests a page/section layout for a more intuitive preview.
 */
export function PreviewPlaceholder({ variant = "section", className }: PreviewPlaceholderProps) {
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-muted to-muted/60 ${className ?? ""}`}
    >
      {/* Wireframe mockup */}
      <div className="w-full max-w-[85%] flex-1 flex flex-col gap-3 min-h-0">
        {/* Header bar */}
        <div className="h-[10%] min-h-3 w-full rounded-sm border border-dashed border-border/60 bg-muted-foreground/5 shrink-0" />
        {/* Content blocks */}
        <div className="flex-1 flex gap-3 min-h-0">
          <div className="w-1/3 rounded-sm border border-dashed border-border/60 bg-muted-foreground/5 shrink-0" />
          <div className="flex-1 rounded-sm border border-dashed border-border/60 bg-muted-foreground/5 shrink-0" />
        </div>
      </div>
      {/* Optional label */}
      <span className="text-[10px] text-muted-foreground/60 mt-2 shrink-0">
        {variant === "page" ? "Page preview" : "Section preview"}
      </span>
    </div>
  )
}
