"use client";

import { type MouseEvent, useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

import { waitForPressRelease } from "@/shared/lib/navigation/wait-for-press-release";

/** 새 탭·다운로드처럼 브라우저에 맡겨야 하는 클릭이 아닌, 보통의 왼쪽 클릭인지. */
export const isPlainLeftClick = (event: MouseEvent) =>
  !event.defaultPrevented && event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;

export const usePressNavigate = () => {
  const router = useRouter();
  const pending = useRef<AbortController | null>(null);

  useEffect(() => () => pending.current?.abort(), []);

  return (event: MouseEvent<HTMLAnchorElement>) => {
    const element = event.currentTarget;
    if (
      !isPlainLeftClick(event) ||
      event.detail === 0 ||
      element.hasAttribute("download") ||
      (element.target && element.target !== "_self")
    )
      return;

    event.preventDefault();
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const cancel = () => controller.abort();
    const options = { once: true, signal: controller.signal };
    // 기다리는 동안 다른 조작이나 뒤로가기를 시작하면 이전 클릭으로 이동하지 않는다.
    document.addEventListener("pointerdown", cancel, options);
    document.addEventListener("keydown", cancel, options);
    window.addEventListener("popstate", cancel, options);
    window.addEventListener("pagehide", cancel, options);
    const sourceHref = window.location.href;
    const destination = new URL(element.href, sourceHref);
    const href = `${destination.pathname}${destination.search}${destination.hash}`;

    void waitForPressRelease(element).then(() => {
      if (!controller.signal.aborted && element.isConnected && window.location.href === sourceHref) {
        router.push(href);
      }
      controller.abort();
    });
  };
};
