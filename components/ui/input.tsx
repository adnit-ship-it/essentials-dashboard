import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "bg-background-color text-body-color border border-gray-300 rounded-md px-3 py-2 w-full outline-none transition-colors",
        "focus:ring-2 focus:ring-accent-color focus:border-accent-color",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
}

export { Input }
