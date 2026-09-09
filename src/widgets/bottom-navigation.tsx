"use client";

import { Gear, type Icon, MapPin, MapPinArea, PencilSimple, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/shared/ui/button";

type Tab = {
  href: string;
  icon: Icon;
  label: string;
  // 탭이 활성으로 보일 경로. 지역 목록은 지도 탭 안의 세그먼트다.
  paths?: readonly string[];
  // 화면 이동이 아니라 행동이라 활성 상태를 갖지 않는다.
  action?: boolean;
};

const TABS: readonly Tab[] = [
  { href: "/", icon: MapPinArea, label: "지도", paths: ["/", "/regions"] },
  { href: "/records", icon: PencilSimple, label: "기록" },
  { href: "/records/new", icon: Plus, label: "기록 남기기", action: true },
  { href: "/places", icon: MapPin, label: "장소" },
  { href: "/settings", icon: Gear, label: "설정" },
];

export function BottomNavigation() {
  const pathname = usePathname() ?? "";
  const activeIndex = TABS.findIndex((tab) => !tab.action && (tab.paths ?? [tab.href]).includes(pathname));

  if (activeIndex === -1) return null;

  return (
    <nav
      aria-label="주요 메뉴"
      className="pointer-events-none fixed inset-x-0 bottom-(--nav-bottom-offset) z-40 pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]"
    >
      <ul className="liquid-glass pointer-events-auto relative mx-auto grid h-(--nav-height) w-[calc(100%-32px)] max-w-[384px] grid-cols-5 overflow-hidden rounded-full p-0.5">
        <li aria-hidden="true" className="pointer-events-none absolute inset-x-1 inset-y-0 z-3 flex items-center">
          <span
            className="liquid-glass-navigation-active block h-[calc(100%-8px)] rounded-full transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(${activeIndex * 100}%)`, width: `${100 / TABS.length}%` }}
          />
        </li>
        {TABS.map(({ action, href, icon: TabIcon, label }, index) => {
          if (action) {
            return (
              <li className="relative z-10 grid min-w-0 place-items-center" key={href}>
                <Button
                  aria-label={label}
                  className="size-[clamp(40px,11.46vw,44px)] min-w-0 rounded-full p-0 shadow-(--shadow-notice)"
                  nativeButton={false}
                  render={<Link href={href} />}
                >
                  <TabIcon aria-hidden="true" className="size-[clamp(20px,5.6vw,24px)]" weight="bold" />
                </Button>
              </li>
            );
          }

          const active = index === activeIndex;

          return (
            <li className="relative z-10 min-w-0" key={href}>
              <Button
                aria-current={active ? "page" : undefined}
                className="h-full flex-col gap-1 rounded-full px-0 py-0 text-[clamp(11px,2.8vw,12px)] transition-colors duration-200 ease-out after:hidden focus-visible:outline focus-visible:outline-ring focus-visible:-outline-offset-2 active:scale-100 data-[active=false]:font-[650] data-[active=true]:font-bold data-[active=false]:text-muted-foreground data-[active=true]:text-foreground [&>span]:flex-col"
                data-active={active}
                fullWidth
                nativeButton={false}
                render={<Link href={href} />}
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
