import type * as React from "react";

import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";

type ChipProps = React.ComponentProps<"button"> & {
  tone?: "brand" | "neutral";
};

function Chip({ className, tone = "neutral", type = "button", ...props }: ChipProps) {
  return (
    <button
      className={cn(
        "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3 font-semibold text-[13px] before:absolute before:inset-x-0 before:-inset-y-1.5 after:inset-0",
        tone === "brand"
          ? "bg-secondary text-secondary-foreground"
          : "bg-muted text-muted-foreground aria-pressed:bg-foreground aria-pressed:text-background",
        PRESS_FEEDBACK,
        FOCUS_RING,
        className,
      )}
      data-slot="chip"
      type={type}
      {...props}
    />
  );
}

export { Chip };
