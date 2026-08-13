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

function isActive(pathname: string | null, href: string) {
  if (!pathname) {
    return false;
  }

  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      /** 화면 바닥에 붙되 본문과 같은 너비를 쓴다. 배경은 홈 인디케이터 영역까지 덮고 패딩으로 탭을 밀어 올린다. */
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full border-border border-t bg-surface pb-[env(safe-area-inset-bottom)] min-[700px]:max-w-[430px]"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}>
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = isActive(pathname, href);

          return (
            <li className="[container-type:inline-size]" key={href}>
              <Link
                aria-current={active ? "page" : undefined}
                className="flex h-14 touch-manipulation flex-col items-center justify-center gap-1 whitespace-nowrap text-[clamp(8px,10.4cqw,10px)] transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2 data-[active=false]:font-[650] data-[active=true]:font-bold data-[active=false]:text-muted-foreground data-[active=true]:text-primary"
                data-active={active}
                href={href}
              >
                {/** 활성 탭만 내부를 옅게 채워 색 말고도 구분되는 채널을 하나 더 둔다. */}
                <Icon
                  aria-hidden="true"
                  className="size-[clamp(16px,22.8cqw,22px)]"
                  fill={active ? "currentColor" : "none"}
                  fillOpacity={active ? 0.22 : 0}
                  strokeWidth={active ? 2.4 : 2}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
