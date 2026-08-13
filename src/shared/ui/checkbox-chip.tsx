import type * as React from "react";

import { CheckIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

function CheckboxChip({ children, className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <label className={cn("cursor-pointer", className)} data-slot="checkbox-chip">
      <input className="peer sr-only" type="checkbox" {...props} />
      <span className="flex min-h-9 items-center gap-1.5 rounded-md border bg-card px-2.5 font-medium text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-ring peer-focus-visible:outline-offset-2 peer-aria-invalid:border-destructive [&>svg]:text-muted-foreground/50 peer-checked:[&>svg]:text-primary">
        <CheckIcon aria-hidden="true" className="size-3.5" />
        {children}
      </span>
    </label>
  );
}

export { CheckboxChip };
