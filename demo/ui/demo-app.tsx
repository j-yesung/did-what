"use client";

import { Fragment, useEffect, useRef } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AppLoading } from "@/app/ui/app-loading";
import { AppNotFound } from "@/app/ui/app-not-found";
import { withReturnTo } from "@/shared/lib/navigation/return-to";

import { getCurrentDemoMember } from "../lib/demo-actions";
import { DEMO_NAVIGATION_KEY } from "../lib/demo-router-bridge";
import { useDemoState } from "../model/store";
import type { DemoState } from "../model/types";
import {
  DemoAnniversariesScreen,
  DemoAppFrame,
  DemoHomeScreen,
  DemoMemberSelectScreen,
  DemoNotificationsScreen,
  DemoPlaceDetailScreen,
  DemoPlacesScreen,
  DemoRecordDetailScreen,
  DemoRecordEditScreen,
  DemoRecordNewScreen,
  DemoRecordsScreen,
  DemoSettingsScreen,
} from "./demo-screens";

type DemoRoute =
  | { group: "app"; name: "anniversaries" | "home" | "notifications" | "places" | "recordNew" | "records" | "settings" }
  | { group: "app"; id: string; name: "placeDetail" | "recordDetail" | "recordEdit" }
  | { group: "member"; name: "memberSelect" }
  | { group: "none"; name: "notFound" };

export const matchDemoRoute = (pathname: string): DemoRoute => {
  const [first, second, third, ...rest] = pathname.split("/").filter(Boolean);
  if (rest.length) return { group: "none", name: "notFound" };
  if (!first) return { group: "app", name: "home" };
  if (first === "anniversaries" && !second) return { group: "app", name: "anniversaries" };
  if (first === "records" && !second) return { group: "app", name: "records" };
  if (first === "records" && second === "new" && !third) return { group: "app", name: "recordNew" };
  if (first === "records" && second && !third) return { group: "app", id: second, name: "recordDetail" };
  if (first === "records" && second && third === "edit") return { group: "app", id: second, name: "recordEdit" };
  if (first === "places" && !second) return { group: "app", name: "places" };
  if (first === "places" && second && !third) return { group: "app", id: second, name: "placeDetail" };
  if (first === "notifications" && !second) return { group: "app", name: "notifications" };
  if (first === "settings" && !second) return { group: "app", name: "settings" };
  if (first === "members" && second === "select" && !third) return { group: "member", name: "memberSelect" };
  return { group: "none", name: "notFound" };
};

const getRedirect = (route: DemoRoute, state: DemoState, currentHref: string) => {
  if (route.group !== "app") return null;
  return getCurrentDemoMember(state) ? null : withReturnTo("/members/select", currentHref);
};

export function DemoApp() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const state = useDemoState();
  const search = searchParams?.toString() ?? "";
  const route = matchDemoRoute(pathname);
  const redirect = getRedirect(route, state, `${pathname}${search ? `?${search}` : ""}`);
  const member = getCurrentDemoMember(state);
  const navigationKey = useRef("");
  const historyKey = window.history.state?.[DEMO_NAVIGATION_KEY];
  if (typeof historyKey === "string") navigationKey.current = historyKey;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (redirect) return <AppLoading />;
  if (route.group === "none") return <AppNotFound />;
  if (route.name === "memberSelect") return <DemoMemberSelectScreen key={navigationKey.current} />;
  if (!member) return <AppLoading />;

  const memberProps = { id: member.id, name: member.name };
  const screen = (() => {
    switch (route.name) {
      case "home":
        return <DemoHomeScreen member={memberProps} />;
      case "anniversaries":
        return <DemoAnniversariesScreen />;
      case "records":
        return <DemoRecordsScreen />;
      case "recordNew":
        return <DemoRecordNewScreen />;
      case "recordDetail":
        return <DemoRecordDetailScreen recordId={route.id} />;
      case "recordEdit":
        return <DemoRecordEditScreen recordId={route.id} />;
      case "places":
        return <DemoPlacesScreen />;
      case "placeDetail":
        return <DemoPlaceDetailScreen placeId={route.id} />;
      case "notifications":
        return <DemoNotificationsScreen member={memberProps} />;
      case "settings":
        return <DemoSettingsScreen member={memberProps} />;
    }
  })();

  return (
    <DemoAppFrame member={memberProps}>
      <Fragment key={`${pathname}:${navigationKey.current}`}>{screen}</Fragment>
    </DemoAppFrame>
  );
}
