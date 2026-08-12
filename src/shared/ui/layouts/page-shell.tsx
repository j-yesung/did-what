import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

// 화면 공통 뼈대. pb는 하단 내비게이션이 가리는 높이라 화면마다 다시 적지 않는다.
export function PageShell({ children, className }: PageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-5 bg-background px-5 pt-6 pb-[var(--nav-clearance)]",
        className,
      )}
    >
      {children}
    </main>
  );
}
