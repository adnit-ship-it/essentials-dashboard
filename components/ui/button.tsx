import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const buttonVariants = {
  default:
    "bg-accent-color text-background-color hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] active:bg-gradient-to-r active:from-[#DDF0E3] active:to-[#D3EBEB] hover:text-black active:text-black",
  outline:
    "border border-input bg-background hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] active:bg-gradient-to-r active:from-[#DDF0E3] active:to-[#D3EBEB] hover:text-black active:text-black",
  ghost:
    "hover:bg-gradient-to-r hover:from-[#DDF0E3] hover:to-[#D3EBEB] active:bg-gradient-to-r active:from-[#DDF0E3] active:to-[#D3EBEB] hover:text-black active:text-black",
  link: "text-primary underline-offset-4 hover:underline",
}

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof buttonSizes
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
        "focus:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    />
  )
}

export { Button }
