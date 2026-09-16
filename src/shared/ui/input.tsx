import type * as React from "react";

import { cn } from "@/shared/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  actionButton?: React.ReactNode;
  containerClassName?: string;
  variant?: "default" | "underline";
};

function Input({
  className,
  containerClassName,
  disabled,
  actionButton,
  readOnly,
  type,
  variant = "default",
  ...props
}: InputProps) {
  const hasActionButton = Boolean(actionButton);

  return (
    <div className={cn("relative w-full", containerClassName)} data-slot="input-field">
      <input
        {...props}
        className={cn(
          "h-8 w-full min-w-0 max-w-full rounded-lg border border-input px-2.5 py-1 text-base outline-none transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          variant === "underline" && "rounded-none border-x-0 border-t-0 px-0 focus-visible:ring-0 aria-invalid:ring-0",
          hasActionButton && "pr-10",
          className,
        )}
        data-slot="input"
        disabled={disabled}
        readOnly={readOnly}
        type={type}
      />
      {actionButton ? <div className="absolute top-1/2 right-0 -translate-y-1/2">{actionButton}</div> : null}
    </div>
  );
}

export { Input, type InputProps };
