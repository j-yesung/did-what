"use client";

import { type ReactNode, useContext, useEffect, useMemo } from "react";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  createDevToolsInstrumentedPromise,
  NavigationPromisesContext,
  PathnameContext,
  ReadonlyURLSearchParams,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { getPageNavigation } from "@/shared/lib/navigation/page-navigation";

import { isDemoAppHref, readAppLocation, toDemoHref } from "./demo-href";

type HistoryMethod = History["pushState"];

/** 화면 이동마다 새로 정하는 값. 같은 경로로 다시 이동해도 실제 앱처럼 화면을 새로 그리는 기준이 된다. */
export const DEMO_NAVIGATION_KEY = "didWhatDemoNavigation";

const rewriteHistoryUrl = (method: HistoryMethod): HistoryMethod =>
  function rewrite(this: History, data, unused, url) {
    return method.call(this, data, unused, typeof url === "string" ? toDemoHref(url) : url);
  };

/**
 * 데모 앱 안에서 화면을 옮긴다. 서버에 화면을 다시 요청하지 않도록 history로 주소만 바꾸고,
 * Next는 바뀐 주소를 useSearchParams에 반영한다(Next가 지원하는 history.pushState 연동).
 * 로그인 여부처럼 화면 가드가 보는 상태를 함께 바꿀 때는 이동을 먼저 한다. 상태가 먼저 바뀌면 가드가 옛 경로로 판단해 다른 곳으로 보낸다.
 */
export const navigateDemo = (href: string, { replace = false, scroll = true } = {}) => {
  const url = toDemoHref(href);
  window.history[replace ? "replaceState" : "pushState"]({ [DEMO_NAVIGATION_KEY]: crypto.randomUUID() }, "", url);
  if (scroll) window.scrollTo(0, 0);
};

/**
 * 앱 컴포넌트는 /records 같은 실제 경로로 이동한다. 데모에서는 같은 이동이 /demo/app?path=… 안에 머물도록 바꾼다.
 * - router.push·replace: 서버 요청 없이 navigateDemo로 옮긴다. prefetch는 받을 것이 없어 하지 않는다.
 * - usePathname·useSearchParams: path 쿼리를 풀어 실제 앱과 같은 경로·쿼리를 보여 준다.
 * - history.replaceState: 달력처럼 주소를 직접 바꾸는 코드도 같은 주소 형식으로 맞춘다.
 * - 키보드로 연 링크: Next Link가 원래 경로로 바로 이동하므로 마우스 클릭과 같은 길(PressLink)로 보낸다.
 * - 마우스로 길게 누르기: 데스크톱에서 보는 체험이라 손을 떼도 관리 메뉴가 유지되게 한다.
 *
 * ponytail: Next 내부 context(app-router-context, hooks-client-context)를 쓴다. Next를 올릴 때 이 파일을 먼저 확인한다.
 */
export function DemoRouterBridge({ children }: { children: ReactNode }) {
  "use no memo";

  const router = useContext(AppRouterContext);
  // Next가 바뀐 주소를 반영하면 다시 그리도록 구독만 하고, 값은 지금 주소에서 읽는다.
  // Next의 값은 전환이 끝난 뒤에야 바뀌어, 그 사이 체험 상태만 먼저 바뀌면 화면이 옛 경로로 판단한다.
  useContext(SearchParamsContext);
  const navigationPromises = useContext(NavigationPromisesContext);
  const realSearch = window.location.search;
  const location = useMemo(() => readAppLocation(realSearch), [realSearch]);

  // 개발 모드의 usePathname·useSearchParams는 이 값을 먼저 읽는다. 아래 레이아웃이 이 객체를 이어 쓰므로 값만 바꿔 넘긴다.
  const demoNavigationPromises = useMemo(
    () =>
      navigationPromises && {
        ...navigationPromises,
        pathname: createDevToolsInstrumentedPromise("usePathname", location.pathname),
        searchParams: createDevToolsInstrumentedPromise(
          "useSearchParams",
          new ReadonlyURLSearchParams(location.searchParams),
        ),
      },
    [location, navigationPromises],
  );

  const demoRouter = useMemo(
    () =>
      router && {
        ...router,
        prefetch: () => undefined,
        push: (href: string, options?: Parameters<typeof router.push>[1]) => {
          if (!isDemoAppHref(toDemoHref(href))) return router.push(href, options);
          navigateDemo(href, { scroll: options?.scroll !== false });
        },
        replace: (href: string, options?: Parameters<typeof router.replace>[1]) => {
          if (!isDemoAppHref(toDemoHref(href))) return router.replace(href, options);
          navigateDemo(href, { replace: true, scroll: options?.scroll !== false });
        },
      },
    [router],
  );

  useEffect(() => {
    // 앱의 이동 기록 패치가 Next 패치보다 먼저 걸리게 해서, 아래 데모 패치가 바꾼 주소를 그대로 받게 한다.
    getPageNavigation(window);

    let restoreHistory = () => {};
    // Next는 루트 effect에서 history를 감싼다. 그보다 바깥에서 주소를 바꿔야 라우터 상태도 데모 경로를 갖는다.
    const timer = window.setTimeout(() => {
      const { pushState, replaceState } = window.history;
      window.history.pushState = rewriteHistoryUrl(pushState);
      window.history.replaceState = rewriteHistoryUrl(replaceState);
      restoreHistory = () => {
        window.history.pushState = pushState;
        window.history.replaceState = replaceState;
      };
    });

    const redirectLink = (event: MouseEvent) => {
      if (event.defaultPrevented || !(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href") ?? "";
      const demoHref = toDemoHref(href);
      if (demoHref === href) return;

      if (
        event.type === "auxclick" ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        event.preventDefault();
        window.open(demoHref, "_blank", "noopener");
        return;
      }
      if (event.detail === 0) Object.defineProperty(event, "detail", { value: 1 });
    };

    /**
     * 기록·장소 관리 메뉴는 길게 눌러 연다. 손가락과 달리 마우스는 떼는 자리(메뉴 배경)로 click이 가서
     * 방금 열린 메뉴가 바로 닫힌다. 누르는 동안 새 대화상자가 열렸으면 그 click만 삼킨다.
     */
    let dialogsAtPress = Number.POSITIVE_INFINITY;
    const countDialogs = () => document.querySelectorAll('[role="dialog"]').length;
    const rememberDialogs = () => {
      dialogsAtPress = countDialogs();
    };
    const keepLongPressMenu = (event: MouseEvent) => {
      if (event.detail !== 0 && countDialogs() > dialogsAtPress) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      dialogsAtPress = Number.POSITIVE_INFINITY;
    };

    window.addEventListener("pointerdown", rememberDialogs, true);
    window.addEventListener("click", keepLongPressMenu, true);
    window.addEventListener("click", redirectLink, true);
    window.addEventListener("auxclick", redirectLink, true);
    return () => {
      window.removeEventListener("pointerdown", rememberDialogs, true);
      window.removeEventListener("click", keepLongPressMenu, true);
      window.clearTimeout(timer);
      restoreHistory();
      window.removeEventListener("click", redirectLink, true);
      window.removeEventListener("auxclick", redirectLink, true);
    };
  }, []);

  return (
    <AppRouterContext.Provider value={demoRouter}>
      <PathnameContext.Provider value={location.pathname}>
        <SearchParamsContext.Provider value={location.searchParams}>
          <NavigationPromisesContext.Provider value={demoNavigationPromises}>
            {children}
          </NavigationPromisesContext.Provider>
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
}
