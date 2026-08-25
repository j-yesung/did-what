"use client";

import { Gear, MapPin, MapPinArea, MapTrifold, PencilSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: MapPinArea, label: "지도" },
  { href: "/records", icon: PencilSimple, label: "기록" },
  { href: "/regions", icon: MapTrifold, label: "지역" },
  { href: "/places", icon: MapPin, label: "장소" },
  { href: "/settings", icon: Gear, label: "설정" },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const activeIndex = TABS.findIndex(({ href }) => href === pathname);

  if (activeIndex === -1) return null;

  return (
    <nav
      aria-label="주요 메뉴"
      className="pointer-events-none fixed inset-x-0 bottom-[max(var(--nav-bottom-gap),calc(var(--nav-bottom-gap)+env(safe-area-inset-bottom)-16px))] z-40 w-full pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]"
    >
      <ul className="pointer-events-auto relative isolate mx-auto grid h-(--nav-height) w-[calc(100%-32px)] max-w-[384px] auto-cols-fr grid-flow-col rounded-full border border-border/70 bg-surface/95 p-1 shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
        <li aria-hidden="true" className="pointer-events-none absolute inset-1 z-0">
          <span
            className="block h-full rounded-full bg-primary/10 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(${activeIndex * 100}%)`, width: `${100 / TABS.length}%` }}
          />
        </li>
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;

          return (
            <li className="relative z-10 min-w-0" key={href}>
              <Link
                aria-current={active ? "page" : undefined}
                className="flex h-full touch-manipulation flex-col items-center justify-center gap-1 whitespace-nowrap rounded-full text-[12px] transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2 data-[active=false]:font-[650] data-[active=true]:font-bold data-[active=false]:text-muted-foreground data-[active=true]:text-primary"
                data-active={active}
                href={href}
                prefetch={true}
              >
                <Icon aria-hidden="true" className="size-5" weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
