"use client";

import { useEffect } from "react";

/**
 * 이 폭 안에서 시작한 터치를 막는다. iOS 앞으로가기 스와이프는 화면 끝 몇 px에서 시작하므로 좁게 잡는다.
 * 넓으면 가장자리에 엄지를 두고 하는 세로 스크롤과 가로 칩 스크롤까지 먹지 않는다.
 * 실기기에서 앞으로가기가 새면 조금씩 넓힌다.
 */
const FORWARD_SWIPE_EDGE_WIDTH = 10;

const isStandalonePwa = () => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

export function PreventForwardSwipe() {
  useEffect(() => {
    if (!isStandalonePwa()) return;

    const preventForwardSwipe = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;

      const touch = event.touches.item(0);
      if (!touch || touch.clientX < window.innerWidth - FORWARD_SWIPE_EDGE_WIDTH) return;

      event.preventDefault();
    };

    document.addEventListener("touchstart", preventForwardSwipe, { capture: true, passive: false });
    return () => document.removeEventListener("touchstart", preventForwardSwipe, true);
  }, []);

  return null;
}
