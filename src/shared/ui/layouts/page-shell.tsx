import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * 화면 공통 뼈대.
 * pt는 상태 표시줄·노치를, pb는 하단 내비게이션이 가리는 높이를 피한다. 화면마다 다시 적지 않는다.
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-5 bg-background px-5 pt-[calc(24px+env(safe-area-inset-top))] pb-[var(--nav-clearance)]",
        className,
      )}
    >
      {children}
    </main>
  );
}
