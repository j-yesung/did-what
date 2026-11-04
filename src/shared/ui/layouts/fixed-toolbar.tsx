import type { ReactNode, Ref } from "react";

import { cn } from "@/shared/lib/utils";

type FixedToolbarProps = {
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export function FixedToolbar({ children, className, ref }: FixedToolbarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className={cn("mx-auto flex w-full max-w-(--app-width) px-5 pt-(--page-top)", className)} ref={ref}>
        {children}
      </div>
    </div>
  );
}
