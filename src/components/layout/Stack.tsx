import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  space?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
}

const spaceClasses = {
  none: "space-y-0",
  xs: "space-y-2",
  sm: "space-y-4",
  md: "space-y-6",
  lg: "space-y-8",
  xl: "space-y-12",
};

export function Stack({
  children,
  space = "md",
  className,
  ...props
}: StackProps) {
  return (
    <div className={cn("flex flex-col", spaceClasses[space], className)} {...props}>
      {children}
    </div>
  );
} 