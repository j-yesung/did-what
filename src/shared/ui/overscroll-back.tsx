"use client";

import type { ReactNode } from "react";

import { CircleChevronLeftIcon } from "@animateicons/react/lucide";
import { CaretDownIcon } from "@phosphor-icons/react";

import { OVERSCROLL_BACK_NAVIGATION_DELAY } from "@/shared/lib/navigation/overscroll-back/overscroll-back";
import { useOverscrollBack } from "@/shared/lib/navigation/overscroll-back/use-overscroll-back";

type OverscrollBackProps = {
  children: ReactNode;
  fallbackHref: string;
};

export function OverscrollBack({ children, fallbackHref }: OverscrollBackProps) {
  const { completeIconRef, containerRef, iconRef, indicatorRef, progressRingRef, touchHandlers } =
    useOverscrollBack(fallbackHref);

  return (
    <>
      <div
        className="h-svh touch-pan-y overflow-y-auto overscroll-contain transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] data-[dragging=true]:duration-0 motion-reduce:transition-none [&>main]:min-h-[calc(100svh+1px)]"
        data-dragging="false"
        ref={containerRef}
        {...touchHandlers}
      >
        {children}
      </div>

      <div
        aria-hidden="true"
        className="group/overscroll-back pointer-events-none fixed inset-x-0 bottom-[calc(12px+env(safe-area-inset-bottom))] z-40 flex justify-center opacity-0 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform data-[dragging=true]:duration-0 motion-reduce:transition-none"
        data-dragging="false"
        data-ready="false"
        ref={indicatorRef}
        style={{ transform: "translate3d(0, 24px, 0)" }}
      >
        <div className="relative flex size-12 items-center justify-center text-muted-foreground transition-colors duration-150 group-data-[ready=true]/overscroll-back:text-background">
          <div className="absolute inset-0 scale-75 rounded-full bg-foreground opacity-0 transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-data-[ready=true]/overscroll-back:scale-100 group-data-[ready=true]/overscroll-back:opacity-100 motion-reduce:transform-none" />
          <svg
            aria-hidden="true"
            className="absolute inset-0 size-full text-foreground transition-opacity duration-150 group-data-[ready=true]/overscroll-back:opacity-0"
            viewBox="0 0 40 40"
          >
            <circle
              className="origin-center fill-none stroke-current"
              cx="20"
              cy="20"
              pathLength="1"
              r="14"
              ref={progressRingRef}
              strokeDasharray="1"
              strokeDashoffset="1"
              strokeLinecap="round"
              strokeWidth="1.5"
              style={{ opacity: 0, transform: "rotate(90deg)" }}
            />
          </svg>
          <div className="relative group-data-[ready=true]/overscroll-back:invisible" ref={iconRef}>
            <CaretDownIcon className="size-6" />
          </div>
          <CircleChevronLeftIcon
            className="invisible absolute group-data-[ready=true]/overscroll-back:visible"
            duration={OVERSCROLL_BACK_NAVIGATION_DELAY / 1000}
            isAnimated={false}
            ref={completeIconRef}
            size={28}
          />
        </div>
      </div>
    </>
  );
}
