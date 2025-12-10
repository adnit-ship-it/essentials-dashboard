import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "bg-background-color text-body-color border border-gray-300 placeholder:text-gray-500 min-h-16 w-full rounded-md px-3 py-2 text-base transition-colors outline-none",
        "focus:ring-2 focus:ring-accent-color focus:border-accent-color",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
