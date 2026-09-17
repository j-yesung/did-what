"use client";

import { useEffect, useRef, useState } from "react";

import { Gear, type Icon, MapPin, MapPinArea, PencilSimple } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { PressLink } from "@/shared/ui/press-link";

import { animateIndicator, cancelIndicatorMotion } from "./motion";

type Tab = {
  href: string;
  icon: Icon;
  label: string;
  paths?: readonly string[];
};

const TABS: readonly Tab[] = [
  { href: "/", icon: MapPinArea, label: "지도", paths: ["/", "/regions"] },
  { href: "/records", icon: PencilSimple, label: "기록" },
  { href: "/places", icon: MapPin, label: "장소" },
  { href: "/settings", icon: Gear, label: "설정" },
];

export function BottomNavigation() {
  const pathname = usePathname() ?? "";
  const activeIndex = TABS.findIndex((tab) => (tab.paths ?? [tab.href]).includes(pathname));

  const activeIndexRef = useRef(activeIndex);
  const pressedTabRef = useRef<number | null>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const displayedActiveIndex = pendingIndex ?? activeIndex;

  useEffect(() => {
    const previousActiveIndex = activeIndexRef.current;
    activeIndexRef.current = activeIndex;
    if (previousActiveIndex === activeIndex) return;

    if (pendingIndex === activeIndex) {
      setPendingIndex(null);
      pressedTabRef.current = null;
      return;
    }

    setPendingIndex(null);
    animateIndicator(indicatorRef.current, previousActiveIndex, activeIndex, TABS.length);
  }, [activeIndex, pendingIndex]);

  const cancelPendingTab = (index: number) => {
    if (pressedTabRef.current !== index) return;

    pressedTabRef.current = null;
    cancelIndicatorMotion(indicatorRef.current);
    setPendingIndex((current) => (current === index ? null : current));
  };

  if (activeIndex === -1) return null;

  return (
    <nav
      aria-label="주요 메뉴"
      className="pointer-events-none fixed inset-x-0 bottom-(--nav-bottom-offset) z-40 pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]"
    >
      <ul
        className="liquid-glass pointer-events-auto relative mx-auto grid h-(--nav-height) w-[calc(100%-32px)] overflow-hidden rounded-full p-0.5"
        style={{
          gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))`,
          maxWidth: `calc(${TABS.length} * (var(--nav-height) + 16px))`,
        }}
      >
        <li aria-hidden="true" className="pointer-events-none absolute inset-x-1 inset-y-0 z-3 flex items-center">
          <span
            className="block h-[calc(100%-8px)] transition-transform duration-280 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(${displayedActiveIndex * 100}%)`, width: `${100 / TABS.length}%` }}
          >
            <span className="liquid-glass-navigation-active block size-full rounded-full" ref={indicatorRef} />
          </span>
        </li>
        {TABS.map(({ href, icon: TabIcon, label }, index) => {
          const active = index === activeIndex;

          return (
            <li className="relative z-10 min-w-0" key={href}>
              <Button
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="h-full rounded-full px-0 transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] after:hidden focus-visible:outline focus-visible:outline-ring focus-visible:-outline-offset-2 active:scale-100 data-[active=false]:text-muted-foreground data-[active=true]:text-foreground"
                data-active={active}
                fullWidth
                nativeButton={false}
                onPointerDown={(event) => {
                  if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

                  if (index === activeIndex) {
                    pressedTabRef.current = null;
                    cancelIndicatorMotion(indicatorRef.current);
                    setPendingIndex(null);
                    return;
                  }

                  const fromIndex = pendingIndex ?? activeIndex;
                  pressedTabRef.current = index;
                  setPendingIndex(index);
                  animateIndicator(indicatorRef.current, fromIndex, index, TABS.length);
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === "touch" && event.buttons === 0) return;
                  cancelPendingTab(index);
                }}
                onPointerCancel={() => cancelPendingTab(index)}
                render={<PressLink href={href} prefetch />}
                variant="ghost"
              >
                <TabIcon aria-hidden="true" className="size-5.5" weight={active ? "fill" : "regular"} />
              </Button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
