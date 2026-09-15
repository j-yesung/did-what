import type * as React from "react";

import { cn } from "@/shared/lib/utils";

function PageSection({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("-mx-5 border-t px-6 pt-5", className)} {...props} />;
}

export { PageSection };
