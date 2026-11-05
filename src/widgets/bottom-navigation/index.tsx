"use client";

import { useSyncExternalStore } from "react";

import { GearIcon, MapPinAreaIcon, MapPinIcon, NotepadIcon } from "@phosphor-icons/react";
import { TabBar } from "glisse";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";
import { PressLink } from "@/shared/ui/press-link";

import "./navigation.css";

const TABS = [
  { href: "/", icon: MapPinAreaIcon, label: "지도" },
  { href: "/records", icon: NotepadIcon, label: "기록" },
  { href: "/places", icon: MapPinIcon, label: "장소" },
  { href: "/settings", icon: GearIcon, label: "설정" },
];

const SIMPLIFIED_NAVIGATION_QUERY =
  "(prefers-reduced-motion: reduce), (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)";

const subscribeSimplifiedNavigation = (onChange: () => void) => {
  const media = window.matchMedia(SIMPLIFIED_NAVIGATION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const getSimplifiedNavigation = () => window.matchMedia(SIMPLIFIED_NAVIGATION_QUERY).matches;
const getServerSimplifiedNavigation = () => false;

export function BottomNavigation() {
  const pathname = usePathname() ?? "";
  const simplifiedNavigation = useSyncExternalStore(
    subscribeSimplifiedNavigation,
    getSimplifiedNavigation,
    getServerSimplifiedNavigation,
  );

  if (!TABS.some((tab) => tab.href === pathname)) return null;

  const items = TABS.map(({ href, icon: TabIcon, label }) => ({
    href,
    value: href,
    label,
    icon: <TabIcon aria-hidden="true" weight="fill" />,
  }));

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]",
        "bottom-(--nav-bottom-offset)",
      )}
    >
      {simplifiedNavigation ? (
        <nav aria-label="주요 메뉴" className="bottom-navigation-static">
          {items.map(({ href, icon, label }) => (
            <PressLink aria-current={href === pathname ? "page" : undefined} href={href} key={href}>
              {icon}
              <span>{label}</span>
            </PressLink>
          ))}
        </nav>
      ) : (
        <TabBar
          aria-label="주요 메뉴"
          className="bottom-navigation-glisse"
          items={items}
          link={PressLink}
          value={pathname}
        />
      )}
    </div>
  );
}
