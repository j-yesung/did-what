"use client";

import { type RefObject, useLayoutEffect } from "react";

import { getPageNavigation } from "./page-navigation";

const scrollPositions = new Map<string, number>();

/** 문서 스크롤과 별개인 내부 컨테이너의 위치를 뒤로/앞으로 이동 시 복원한다. */
export const useScrollRestoration = (containerRef: RefObject<HTMLDivElement | null>, enabled = true) => {
  useLayoutEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const key = window.location.pathname + window.location.search;
    // 첫 paint 전에 한 번 복원한다. 아직 렌더링되지 않은 콘텐츠의 높이는 반영하지 못한다.
    if (getPageNavigation(window).traversal) container.scrollTop = scrollPositions.get(key) ?? 0;

    const save = () => scrollPositions.set(key, container.scrollTop);
    container.addEventListener("scroll", save, { passive: true });

    return () => container.removeEventListener("scroll", save);
  }, [containerRef, enabled]);
};
