"use client";

import { usePathname } from "next/navigation";

import { PressLink } from "@/shared/ui/press-link";
import { SegmentedControl, SegmentedControlItem } from "@/shared/ui/segmented-control";

const SEGMENTS = [
  { href: "/", label: "지도" },
  { href: "/regions", label: "지역" },
] as const;

export function MapSegment() {
  const pathname = usePathname() ?? "";

  return (
    <div className="h-13">
      <div className="pointer-events-none fixed inset-x-0 top-[calc(24px+env(safe-area-inset-top))] z-20">
        <div className="mx-auto w-full max-w-(--app-width) px-5">
          <SegmentedControl
            aria-label="지도 보기"
            className="liquid-glass pointer-events-auto w-32 rounded-full"
            role="navigation"
            size="large"
            value={pathname}
          >
            {SEGMENTS.map(({ href, label }) => (
              <SegmentedControlItem key={href} render={<PressLink href={href} prefetch />} value={href}>
                {label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>
      </div>
    </div>
  );
}
