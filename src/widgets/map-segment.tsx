"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SegmentedControl, SegmentedControlItem } from "@/shared/ui/segmented-control";

const SEGMENTS = [
  { href: "/", label: "지도" },
  { href: "/regions", label: "지역" },
] as const;

export function MapSegment() {
  const pathname = usePathname() ?? "";

  return (
    <div className="sticky top-0 z-20 -mx-5 -mt-[calc(24px+env(safe-area-inset-top))] bg-background px-5 pt-[calc(24px+env(safe-area-inset-top))]">
      <SegmentedControl
        aria-label="지도 보기"
        className="bg-(--map-segment-track) [&_[data-slot=segmented-control-indicator]]:bg-(--map-segment-selected)"
        role="navigation"
        size="large"
        value={pathname}
      >
        {SEGMENTS.map(({ href, label }) => (
          <SegmentedControlItem key={href} render={<Link href={href} prefetch />} value={href}>
            {label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </div>
  );
}
