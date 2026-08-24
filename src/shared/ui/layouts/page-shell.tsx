"use client";

import { type ReactNode, useLayoutEffect } from "react";

import { CaretDownIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

import { useEndSwipeBack } from "@/shared/lib/navigation/use-end-swipe-back";
import { cn } from "@/shared/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  endSwipeBackFallback?: string;
  withBottomNavigation?: boolean;
};

/**
 * 상태 표시줄·노치와 홈 인디케이터를 피하고, 최상위 탭에서는 하단 내비게이션 높이까지 확보한다.
 */
export function PageShell({ children, className, endSwipeBackFallback, withBottomNavigation = false }: PageShellProps) {
  const pathname = usePathname();
  const { iconRef, indicatorRef, shellRef, swipeHandlers } = useEndSwipeBack(endSwipeBackFallback);

  useLayoutEffect(() => {
    // 상세 화면은 항상 위에서 시작하고, 목록으로 돌아갈 때는 브라우저가 기존 위치를 복원하게 둔다.
    if (!withBottomNavigation && window.location.pathname === pathname) window.scrollTo(0, 0);
  }, [pathname, withBottomNavigation]);

  return (
    <>
      <main
        className={cn(
          "mx-auto flex min-h-svh w-full max-w-(--app-width) flex-col gap-5 bg-background px-5 pt-[calc(24px+env(safe-area-inset-top))]",
          withBottomNavigation
            ? "pb-[var(--nav-clearance)]"
            : endSwipeBackFallback
              ? "pb-[calc(76px+env(safe-area-inset-bottom))]"
              : "pb-[calc(24px+env(safe-area-inset-bottom))]",
          withBottomNavigation
            ? "motion-safe:animate-[tab-content-enter_160ms_cubic-bezier(0.2,0,0,1)_both]"
            : "motion-safe:animate-[screen-content-enter_280ms_cubic-bezier(0.2,0,0,1)_both]",
          endSwipeBackFallback &&
            "touch-pan-y transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.4,0,1,1)] data-[swipe-back-exit=true]:pointer-events-none data-[swipe-back-exit=true]:translate-x-6 data-[swiping=true]:select-none data-[swipe-back-exit=true]:opacity-0 motion-reduce:transition-none",
          className,
        )}
        ref={shellRef}
        {...swipeHandlers}
      >
        {children}
      </main>

      {endSwipeBackFallback ? (
        <div
          aria-hidden="true"
          className="group/end-swipe pointer-events-none fixed inset-x-0 bottom-[calc(12px+env(safe-area-inset-bottom))] z-40 flex justify-center opacity-0 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)] will-change-transform data-[dragging=true]:duration-0 motion-reduce:transition-none"
          data-dragging="false"
          data-ready="false"
          ref={indicatorRef}
          style={{ transform: "translate3d(0, 24px, 0) scale(0.82)" }}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-popover text-foreground shadow-lg ring-1 ring-border transition-colors duration-150 group-data-[ready=true]/end-swipe:bg-foreground group-data-[ready=true]/end-swipe:text-background">
            <div
              className="transition-transform duration-150 group-data-[dragging=true]/end-swipe:duration-0"
              ref={iconRef}
            >
              <CaretDownIcon className="size-5" weight="bold" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
