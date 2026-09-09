import type * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex max-w-full shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 font-[650] text-[11px] leading-4",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-secondary text-secondary-foreground",
        success: "bg-success/10 text-success",
        danger: "bg-danger-fill text-danger-fill-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} data-slot="badge" {...props} />;
}

export { Badge, badgeVariants };
