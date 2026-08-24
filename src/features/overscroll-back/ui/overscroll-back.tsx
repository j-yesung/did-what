"use client";

import type { ReactNode } from "react";

import { CaretDownIcon } from "@phosphor-icons/react";

import { useOverscrollBack } from "../model/use-overscroll-back";

type OverscrollBackProps = {
  children: ReactNode;
  fallbackHref: string;
};

export function OverscrollBack({ children, fallbackHref }: OverscrollBackProps) {
  const { iconRef, indicatorRef, touchHandlers } = useOverscrollBack(fallbackHref);

  return (
    <>
      <div className="touch-pan-y [&>main]:pb-[calc(76px+env(safe-area-inset-bottom))]" {...touchHandlers}>
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
        <div className="flex size-12 items-center justify-center rounded-full bg-popover text-foreground shadow-lg ring-1 ring-border transition-colors duration-150 group-data-[ready=true]/overscroll-back:bg-foreground group-data-[ready=true]/overscroll-back:text-background">
          <div
            className="transition-transform duration-150 group-data-[dragging=true]/overscroll-back:duration-0"
            ref={iconRef}
          >
            <CaretDownIcon className="size-5" weight="bold" />
          </div>
        </div>
      </div>
    </>
  );
}
