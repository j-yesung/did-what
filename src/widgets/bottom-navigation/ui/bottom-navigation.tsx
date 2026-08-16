"use client";

import { Gear, MapPin, MapPinArea, PencilSimple, Users } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: MapPinArea, label: "지도" },
  { href: "/records", icon: PencilSimple, label: "기록" },
  { href: "/places", icon: MapPin, label: "장소" },
  { href: "/people", icon: Users, label: "사람" },
  { href: "/settings", icon: Gear, label: "설정" },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();

  if (!TABS.some(({ href }) => href === pathname)) return null;

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full border-border border-t bg-surface pb-[env(safe-area-inset-bottom)] min-[700px]:max-w-(--app-width)"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}>
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;

          return (
            <li key={href}>
              <Link
                aria-current={active ? "page" : undefined}
                className="flex h-14 touch-manipulation flex-col items-center justify-center gap-1 whitespace-nowrap text-[12px] transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2 data-[active=false]:font-[650] data-[active=true]:font-bold data-[active=false]:text-muted-foreground data-[active=true]:text-foreground"
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
