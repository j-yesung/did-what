"use client";

import { type ReactNode, useState } from "react";

import { Ssgoi, type SsgoiConfig, type SsgoiFramework, SsgoiLayoutBoundary } from "@ssgoi/react";
import { drill } from "@ssgoi/react/view-transitions";
import { useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";

import "./app-route-transitions.css";

const ANNIVERSARIES_PATH = "/anniversaries";
const RECORD_CREATE_PATH = "/records/new";
const NOTIFICATIONS_PATH = "/notifications";
const PLACES_PATH = "/places";
const PLACE_DETAIL_PATTERN = `${PLACES_PATH}/*`;
const TOOLBAR_ENTRY_PATHS = ["/", "/records", PLACES_PATH, "/settings"];

const isToolbarEntry = (path: string | null) => path !== null && TOOLBAR_ENTRY_PATHS.includes(path);
const isPlaceDetail = (path: string | null) => path?.startsWith(`${PLACES_PATH}/`) === true;

const isRecordCreateEntry = (path: string | null) => isToolbarEntry(path) || isPlaceDetail(path);

const config: SsgoiConfig = {
  transitions: [
    { from: "/", to: ANNIVERSARIES_PATH, transition: drill() },
    { from: [...TOOLBAR_ENTRY_PATHS, PLACE_DETAIL_PATTERN], to: RECORD_CREATE_PATH, transition: drill() },
    { from: TOOLBAR_ENTRY_PATHS, to: NOTIFICATIONS_PATH, transition: drill() },
    { from: PLACES_PATH, to: PLACE_DETAIL_PATTERN, transition: drill() },
  ],
};
const reducedMotionConfig: SsgoiConfig = { transitions: [] };

const framework: SsgoiFramework = {
  useRoute() {
    const pathname = usePathname();
    return pathname ? { pathname } : null;
  },
};

export function AppRouteTransitions({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [visit, setVisit] = useState<{ pathname: string | null; from: string | null }>({ pathname, from: null });
  const from = visit.pathname === pathname ? visit.from : visit.pathname;

  if (visit.pathname !== pathname) setVisit({ pathname, from });

  const isAnniversaryTransition = pathname === ANNIVERSARIES_PATH || (pathname === "/" && from === ANNIVERSARIES_PATH);
  const isRecordCreateTransition =
    (pathname === RECORD_CREATE_PATH && isRecordCreateEntry(from)) ||
    (from === RECORD_CREATE_PATH && isRecordCreateEntry(pathname));
  const isNotificationsTransition =
    (pathname === NOTIFICATIONS_PATH && isToolbarEntry(from)) ||
    (from === NOTIFICATIONS_PATH && isToolbarEntry(pathname));
  const isPlaceTransition =
    (from === PLACES_PATH && isPlaceDetail(pathname)) || (pathname === PLACES_PATH && isPlaceDetail(from));
  const useAppWidth =
    pathname === ANNIVERSARIES_PATH ||
    pathname === RECORD_CREATE_PATH ||
    pathname === NOTIFICATIONS_PATH ||
    isRecordCreateEntry(pathname);

  // Drill이 다시 붙이는 이전 화면에도 기본 등장 효과 제거를 적용한다.
  return (
    <div
      className={cn("relative z-0 min-h-dvh overflow-x-clip", useAppWidth && "mx-auto w-full max-w-(--app-width)")}
      data-suppress-page-entrance={
        isAnniversaryTransition ||
        isRecordCreateTransition ||
        isNotificationsTransition ||
        isPlaceTransition ||
        undefined
      }
    >
      <Ssgoi config={reduceMotion ? reducedMotionConfig : config} framework={framework}>
        <SsgoiLayoutBoundary>{children}</SsgoiLayoutBoundary>
      </Ssgoi>
    </div>
  );
}
