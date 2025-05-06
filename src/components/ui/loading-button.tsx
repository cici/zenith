import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  spinner?: React.ReactNode;
}

export function LoadingButton({
  children,
  isLoading = false,
  loadingText,
  spinner,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  const content = isLoading ? loadingText || children : children;
  
  return (
    <Button
      className={cn('relative', className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          {spinner || <Loader2 className="h-4 w-4 animate-spin" />}
        </span>
      )}
      <span className={cn(isLoading ? 'invisible' : 'visible')}>{content}</span>
    </Button>
  );
} 