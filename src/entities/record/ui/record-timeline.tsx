import type * as React from "react";

import { cn } from "@/shared/lib/utils";

export function RecordTimeline({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("flex flex-col gap-4", className)} {...props} />;
}
