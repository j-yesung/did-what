"use client";

import type { ReactNode } from "react";

import { CaretDownIcon } from "@phosphor-icons/react";

import { useOverscrollBack } from "../model/use-overscroll-back";

type OverscrollBackProps = {
  children: ReactNode;
  fallbackHref: string;
};

export function OverscrollBack({ children, fallbackHref }: OverscrollBackProps) {
  const { containerRef, iconRef, indicatorRef, progressRingRef, touchHandlers } = useOverscrollBack(fallbackHref);

  return (
    <>
      <div
        className="h-svh touch-pan-y overflow-y-auto overscroll-contain transition-transform duration-200 ease-[cubic-bezier(0.4,0,1,1)] data-[dragging=true]:duration-0 motion-reduce:transition-none [&>main]:pb-[calc(76px+env(safe-area-inset-bottom))]"
        data-dragging="false"
        ref={containerRef}
        {...touchHandlers}
      >
        {children}
      </div>

      <div
        aria-hidden="true"
        className="group/overscroll-back pointer-events-none fixed inset-x-0 bottom-[calc(12px+env(safe-area-inset-bottom))] z-40 flex justify-center opacity-0 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)] will-change-transform data-[dragging=true]:duration-0 motion-reduce:transition-none"
        data-dragging="false"
        data-ready="false"
        ref={indicatorRef}
        style={{ transform: "translate3d(0, 24px, 0) scale(0.82)" }}
      >
        <div className="relative flex size-12 items-center justify-center rounded-full bg-popover text-foreground shadow-lg transition-colors duration-150 group-data-[ready=true]/overscroll-back:bg-foreground group-data-[ready=true]/overscroll-back:text-background">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full -rotate-90"
            viewBox="0 0 48 48"
          >
            <circle className="fill-none stroke-border" cx="24" cy="24" pathLength="1" r="22" strokeWidth="2" />
            <circle
              className="fill-none stroke-foreground transition-[stroke-dashoffset] duration-200 ease-out group-data-[dragging=true]/overscroll-back:duration-0"
              cx="24"
              cy="24"
              pathLength="1"
              r="22"
              ref={progressRingRef}
              strokeDasharray="1"
              strokeDashoffset="1"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
          <div
            className="relative transition-transform duration-150 group-data-[dragging=true]/overscroll-back:duration-0"
            ref={iconRef}
          >
            <CaretDownIcon className="size-5" weight="bold" />
          </div>
        </div>
      </div>
    </>
  );
}
