"use client";

import {
  type ComponentProps,
  type CSSProperties,
  createContext,
  useContext,
  useOptimistic,
  useSyncExternalStore,
} from "react";

import { GearIcon, HouseIcon, MapPinIcon, NotepadIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";
import { GooeyNav } from "@/shared/ui/gooey-nav";
import { PressLink } from "@/shared/ui/press-link";

import "./navigation.css";

const TABS = [
  { href: "/", icon: HouseIcon, label: "홈" },
  { href: "/records", icon: NotepadIcon, label: "기록" },
  { href: "/places", icon: MapPinIcon, label: "장소" },
  { href: "/settings", icon: GearIcon, label: "설정" },
];

const TabNavigateContext = createContext<(href: string) => void>(() => {});

const TabLink = (props: ComponentProps<typeof PressLink>) => (
  <PressLink onPressNavigate={useContext(TabNavigateContext)} prefetch {...props} />
);

const SIMPLIFIED_NAVIGATION_QUERY =
  "(prefers-reduced-motion: reduce), (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)";

const subscribeSimplifiedNavigation = (onChange: () => void) => {
  const media = window.matchMedia(SIMPLIFIED_NAVIGATION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const getSimplifiedNavigation = () => window.matchMedia(SIMPLIFIED_NAVIGATION_QUERY).matches;
const getServerSimplifiedNavigation = () => false;

const subscribeDark = (onChange: () => void) => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
};
const getDark = () => getComputedStyle(document.documentElement).colorScheme === "dark";
const getServerDark = () => false;

const GOOEY_FRAME = {
  "--gn-frame": "var(--tab-bar-glass)",
  "--gn-frame-edge": "var(--navigation-edge)",
  "--gn-frame-shadow": "var(--navigation-shadow)",
  "--gn-frame-highlight": "light-dark(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.07))",
  "--gn-font": "0.75rem",
  "--gn-ink": "light-dark(#27272a, #f4f4f5)",
  "--gn-muted": "light-dark(rgba(39, 39, 42, 0.62), rgba(244, 244, 245, 0.62))",
} as CSSProperties;

export function BottomNavigation() {
  const pathname = usePathname() ?? "";
  const [activePath, setActivePath] = useOptimistic(pathname);
  const dark = useSyncExternalStore(subscribeDark, getDark, getServerDark);
  const simplifiedNavigation = useSyncExternalStore(
    subscribeSimplifiedNavigation,
    getSimplifiedNavigation,
    getServerSimplifiedNavigation,
  );

  if (!TABS.some((tab) => tab.href === pathname)) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 flex justify-center pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]",
        "bottom-(--nav-bottom-offset)",
      )}
    >
      {simplifiedNavigation ? (
        <nav aria-label="주요 메뉴" className="bottom-navigation-static">
          {TABS.map(({ href, icon: TabIcon, label }) => (
            <TabLink aria-current={href === pathname ? "page" : undefined} href={href} key={href}>
              <TabIcon aria-hidden="true" weight="fill" />
              <span>{label}</span>
            </TabLink>
          ))}
        </nav>
      ) : (
        <TabNavigateContext value={setActivePath}>
          <GooeyNav
            activeIndex={TABS.findIndex((tab) => tab.href === activePath)}
            className="pointer-events-auto h-(--nav-height) w-[calc(100%-32px)] max-w-82! backdrop-blur-[3px]! backdrop-saturate-150! [&>div]:size-full [&_li>*]:min-w-0 [&_li>*]:flex-1 [&_li>*]:flex-col [&_li>*]:justify-center [&_li>*]:gap-0.5 [&_li>*]:p-0 [&_li]:min-w-0 [&_li]:flex-1 [&_svg]:size-4.5! [&_ul]:size-full [&_ul]:flex-nowrap"
            items={TABS.map(({ href, icon: TabIcon, label }) => ({
              href,
              icon: <TabIcon aria-hidden="true" weight="fill" />,
              label,
            }))}
            link={TabLink}
            animationTime={500}
            spread={38}
            style={GOOEY_FRAME}
            theme={dark ? "dark" : "light"}
          />
        </TabNavigateContext>
      )}
    </div>
  );
}
