"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";

const SEGMENTS = [
  { href: "/", label: "지도" },
  { href: "/regions", label: "지역" },
] as const;

/** 지도 탭 안의 지도·지역 전환. 예전 하단 탭의 지역 자리를 옮긴 것이라 하단 탭과 같은 Link 이동을 쓴다. */
export function MapSegment() {
  const pathname = usePathname();
  const activeIndex = Math.max(
    SEGMENTS.findIndex(({ href }) => href === pathname),
    0,
  );

  return (
    <nav aria-label="지도 보기" className="relative flex h-10 w-full rounded-xl bg-muted p-1">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 left-1 rounded-lg bg-surface shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] will-change-transform motion-reduce:transition-none"
        style={{ transform: `translateX(${activeIndex * 100}%)`, width: `calc((100% - 8px) / ${SEGMENTS.length})` }}
      />
      {SEGMENTS.map(({ href, label }) => {
        const active = pathname === href;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative z-10 flex h-8 min-w-0 flex-1 touch-manipulation select-none items-center justify-center rounded-lg px-2 font-medium text-sm transition-[color,transform] duration-200 ease-out [-webkit-tap-highlight-color:transparent] active:scale-[0.98] motion-reduce:active:scale-100",
              active ? "text-foreground" : "text-muted-foreground",
              FOCUS_RING,
            )}
            href={href}
            key={href}
            prefetch
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
