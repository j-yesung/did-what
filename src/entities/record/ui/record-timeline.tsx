import type * as React from "react";

import { cn } from "@/shared/lib/utils";

// 카드 왼쪽 점들을 잇는 세로선을 그린다. 첫 자식은 제목이나 개수 같은 머리글이라고 보고 위를 비운다.
export function RecordTimeline({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "relative flex flex-col gap-4 before:absolute before:top-9 before:bottom-4 before:left-1.75 before:w-px before:bg-border",
        className,
      )}
      {...props}
    />
  );
}
