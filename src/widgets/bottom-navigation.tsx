"use client";

import { Gear, type Icon, MapPin, MapPinArea, PencilSimple } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { PressLink } from "@/shared/ui/press-link";

type Tab = {
  href: string;
  icon: Icon;
  label: string;
  // 탭이 활성으로 보일 경로. 지역 목록은 지도 탭 안의 세그먼트다.
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

  if (activeIndex === -1) return null;

  return (
    <nav
      aria-label="주요 메뉴"
      className="pointer-events-none fixed inset-x-0 bottom-(--nav-bottom-offset) z-40 pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]"
    >
      <ul className="liquid-glass pointer-events-auto relative mx-auto grid h-(--nav-height) w-[calc(100%-32px)] max-w-[384px] grid-cols-4 overflow-hidden rounded-full p-0.5">
        <li aria-hidden="true" className="pointer-events-none absolute inset-x-1 inset-y-0 z-3 flex items-center">
          <span
            className="liquid-glass-navigation-active block h-[calc(100%-8px)] rounded-full transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(${activeIndex * 100}%)`, width: `${100 / TABS.length}%` }}
          />
        </li>
        {TABS.map(({ href, icon: TabIcon, label }, index) => {
          const active = index === activeIndex;

          return (
            <li className="relative z-10 min-w-0" key={href}>
              <Button
                aria-current={active ? "page" : undefined}
                className="h-full flex-col gap-1 rounded-full px-0 py-0 text-[clamp(11px,2.8vw,12px)] transition-colors duration-200 ease-out after:hidden focus-visible:outline focus-visible:outline-ring focus-visible:-outline-offset-2 active:scale-100 data-[active=false]:font-[650] data-[active=true]:font-bold data-[active=false]:text-muted-foreground data-[active=true]:text-foreground [&>span]:flex-col"
                data-active={active}
                fullWidth
                nativeButton={false}
                render={<PressLink href={href} prefetch />}
                variant="ghost"
              >
                <TabIcon
                  aria-hidden="true"
                  className="size-[clamp(20px,5.6vw,24px)]"
                  weight={active ? "fill" : "regular"}
                />
                {label}
              </Button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
