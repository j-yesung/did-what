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
    <div className="sticky top-[calc(24px+env(safe-area-inset-top))] z-20">
      <SegmentedControl
        aria-label="지도 보기"
        className="liquid-glass w-1/2 rounded-full"
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
