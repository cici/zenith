import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonProps } from "@/components/ui/button";

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export function LoadingButton({ 
  children, 
  isLoading, 
  loadingText,
  disabled,
  className,
  "aria-label": ariaLabel,
  ...props 
}: LoadingButtonProps) {
  return (
    <Button
      disabled={isLoading || disabled}
      className={cn("relative", className)}
      aria-busy={isLoading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {isLoading && (
        <Loader2 
          className="mr-2 h-4 w-4 animate-spin"
          aria-hidden="true"
        />
      )}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  );
} 