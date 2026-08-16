import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  withBottomNavigation?: boolean;
};

/**
 * 화면 공통 뼈대.
 * 상태 표시줄·노치와 홈 인디케이터를 피하고, 최상위 탭에서는 하단 내비게이션 높이까지 확보한다.
 */
export function PageShell({ children, className, withBottomNavigation = false }: PageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-svh w-full max-w-(--app-width) flex-col gap-5 bg-background px-5 pt-[calc(24px+env(safe-area-inset-top))]",
        withBottomNavigation ? "pb-[var(--nav-clearance)]" : "pb-[calc(24px+env(safe-area-inset-bottom))]",
        withBottomNavigation && "motion-safe:animate-[tab-content-enter_160ms_cubic-bezier(0.2,0,0,1)_both]",
        className,
      )}
    >
      {children}
    </main>
  );
}
