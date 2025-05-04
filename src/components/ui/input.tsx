import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  "aria-describedby"?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, "aria-describedby": ariaDescribedby, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "appearance-none flex h-10 w-full rounded-md border border-input bg-background dark:bg-slate-950 px-3 py-2 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={ariaDescribedby}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
