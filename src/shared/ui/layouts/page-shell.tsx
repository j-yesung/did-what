"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

import { usePathname } from "next/navigation";

import { getPageNavigation } from "@/shared/lib/navigation/page-navigation";
import { cn } from "@/shared/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  withBottomNavigation?: boolean;
};

export function PageShell({ children, className, withBottomNavigation = false }: PageShellProps) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main || window.location.pathname !== pathname) return;
    const navigation = getPageNavigation(window);

    // 첫 paint 전에 적용해야 iOS의 이전 화면 스냅샷 다음에 투명한 프레임이 끼지 않는다.
    main.style.animation = navigation.traversal ? "none" : "";
    // 지도 template처럼 안쪽에서 실행하는 등장 효과에도 같은 이동 기준을 전달한다.
    main.style.setProperty("--tab-enter-name", navigation.traversal ? "none" : "tab-content-enter");
    // 상세 화면은 항상 위에서 시작하고 목록의 스크롤 복원은 브라우저에 맡긴다.
    if (!withBottomNavigation) window.scrollTo(0, 0);
  }, [pathname, withBottomNavigation]);

  return (
    <main
      ref={mainRef}
      className={cn(
        "mx-auto flex min-h-svh w-full max-w-(--app-width) flex-col gap-5 bg-background px-5 pt-[calc(24px+env(safe-area-inset-top))]",
        withBottomNavigation ? "pb-(--nav-clearance)" : "pb-[calc(24px+env(safe-area-inset-bottom))]",
        withBottomNavigation
          ? "motion-safe:animate-[tab-content-enter_160ms_cubic-bezier(0.2,0,0,1)_both]"
          : "motion-safe:animate-[screen-content-enter_280ms_cubic-bezier(0.2,0,0,1)_both]",
        className,
      )}
    >
      {children}
    </main>
  );
}
