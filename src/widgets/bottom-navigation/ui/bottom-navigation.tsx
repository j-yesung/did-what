"use client";

import { MapIcon, MapPinIcon, NotebookPenIcon, SettingsIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: MapIcon, label: "지도" },
  { href: "/records", icon: NotebookPenIcon, label: "기록" },
  { href: "/places", icon: MapPinIcon, label: "장소" },
  { href: "/people", icon: UsersIcon, label: "사람" },
  { href: "/settings", icon: SettingsIcon, label: "설정" },
] as const;

const CONTAINER_PADDING = 6;

function isActive(pathname: string | null, href: string) {
  if (!pathname) {
    return false;
  }

  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNavigation() {
  const pathname = usePathname();
  const activeIndex = TABS.findIndex((tab) => isActive(pathname, tab.href));

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-[calc(22px+env(safe-area-inset-bottom))] z-50 mx-auto w-[min(100%-32px,398px)] rounded-[28px] border border-border/60 bg-[color-mix(in_srgb,var(--surface),transparent_22%)] p-1.5 shadow-[0_12px_40px_color-mix(in_srgb,var(--brand-950),transparent_86%)] backdrop-blur-2xl"
    >
      {/* 탭 사이를 미끄러지는 배경. 자기 너비(=탭 한 칸)만큼 이동한다. */}
      <div
        aria-hidden="true"
        className="absolute inset-y-1.5 left-1.5 rounded-[22px] bg-primary/10 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
        style={{
          opacity: activeIndex < 0 ? 0 : 1,
          transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
          width: `calc((100% - ${CONTAINER_PADDING * 2}px) / ${TABS.length})`,
        }}
      />

      <ul className="relative grid" style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}>
        {TABS.map(({ href, icon: Icon, label }, index) => {
          const active = index === activeIndex;

          return (
            <li className="[container-type:inline-size]" key={href}>
              <Link
                aria-current={active ? "page" : undefined}
                className="flex min-h-[52px] touch-manipulation flex-col items-center justify-center gap-1 whitespace-nowrap rounded-[22px] font-[650] text-[clamp(8px,10.4cqw,10px)] transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2 data-[active=false]:text-muted-foreground data-[active=true]:text-primary"
                data-active={active}
                href={href}
              >
                <Icon aria-hidden="true" className="size-[clamp(16px,22.8cqw,22px)]" strokeWidth={2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
