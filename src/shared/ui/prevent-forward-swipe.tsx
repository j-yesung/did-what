"use client";

import { useEffect } from "react";

const FORWARD_SWIPE_EDGE_WIDTH = 24;

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
