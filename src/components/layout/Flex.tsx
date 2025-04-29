import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "col";
  mdDirection?: "row" | "col";
  lgDirection?: "row" | "col";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  gap?: "none" | "sm" | "md" | "lg" | "xl";
}

const directionClasses = {
  row: "flex-row",
  col: "flex-col",
};

const mdDirectionClasses = {
  row: "md:flex-row",
  col: "md:flex-col",
};

const lgDirectionClasses = {
  row: "lg:flex-row",
  col: "lg:flex-col",
};

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyClasses = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

const gapClasses = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

export function Flex({
  children,
  direction = "row",
  mdDirection,
  lgDirection,
  align = "start",
  justify = "start",
  wrap = false,
  gap = "none",
  className,
  ...props
}: FlexProps) {
  return (
    <div
      className={cn(
        "flex",
        directionClasses[direction],
        mdDirection && mdDirectionClasses[mdDirection],
        lgDirection && lgDirectionClasses[lgDirection],
        alignClasses[align],
        justifyClasses[justify],
        wrap && "flex-wrap",
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 