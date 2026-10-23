import type * as React from "react";

import { cn } from "@/shared/lib/utils";

function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center whitespace-nowrap rounded-md bg-muted px-2 py-0.5 font-[650] text-[11px] text-muted-foreground leading-4",
        className,
      )}
      data-slot="badge"
      {...props}
    />
  );
}

export { Badge };
