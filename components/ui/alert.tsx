import * as React from "react"

import { cn } from "@/lib/utils"

const alertVariants = {
  default: "bg-background text-foreground border-gray-300",
  destructive:
    "border-red-200 bg-red-50 text-red-700 [&>svg]:text-red-700",
}

function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: keyof typeof alertVariants
}) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        "[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px]",
        "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
        alertVariants[variant],
        className
      )}
      {...props}
    />
  )
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"h5">) {
  return (
    <h5
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }



