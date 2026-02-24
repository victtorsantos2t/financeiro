import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-background border-2 border-border h-[42px] w-full min-w-0 rounded-none px-4 py-2 font-black text-[12px] uppercase tracking-widest shadow-none transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-[10px] file:font-black disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-primary focus-visible:ring-0",
        "aria-invalid:border-destructive aria-invalid:ring-0",
        className
      )}
      {...props}
    />
  )
}

export { Input }

// aria-label
