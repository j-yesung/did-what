"use client";

import { type TouchEvent, useRef } from "react";

import { useGoBack } from "@/shared/lib/navigation/use-go-back";

import { getOverscrollBackProgress, isAtScrollEnd } from "./overscroll-back";

export function useOverscrollBack(fallbackHref: string) {
  const goBackTo = useGoBack();
  const indicatorRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const progressRef = useRef(0);
  const navigatingRef = useRef(false);
  const reduceMotionRef = useRef(false);

  const resetSwipe = () => {
    const indicator = indicatorRef.current;
    const icon = iconRef.current;

    touchStartRef.current = null;
    progressRef.current = 0;

    if (indicator) {
      indicator.dataset.dragging = "false";
      indicator.dataset.ready = "false";
      indicator.style.opacity = "0";
      indicator.style.transform = "translate3d(0, 24px, 0) scale(0.82)";
    }
    if (icon) icon.style.transform = "rotate(0deg)";
  };

  const startSwipe = (event: TouchEvent<HTMLDivElement>) => {
    if (navigatingRef.current || event.touches.length !== 1) return;
    if (!isAtScrollEnd(document.documentElement.scrollHeight, window.innerHeight, window.scrollY)) return;

    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  const moveSwipe = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const indicator = indicatorRef.current;
    const icon = iconRef.current;
    if (!start || !indicator || !icon || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const progress = getOverscrollBackProgress(start, { x: touch.clientX, y: touch.clientY });
    progressRef.current = progress;

    indicator.dataset.dragging = "true";
    indicator.dataset.ready = String(progress === 1);
    indicator.style.opacity = String(Math.min(progress * 1.6, 1));
    indicator.style.transform = reduceMotionRef.current
      ? "translate3d(0, 0, 0) scale(1)"
      : `translate3d(0, ${(1 - progress) * 24}px, 0) scale(${0.82 + progress * 0.18})`;
    icon.style.transform = `rotate(${reduceMotionRef.current ? 90 : progress * 90}deg)`;
  };

  const finishSwipe = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;

    if (event.touches.length > 0 || progressRef.current < 1) {
      resetSwipe();
      return;
    }

    touchStartRef.current = null;
    navigatingRef.current = true;
    goBackTo(fallbackHref);
  };

  return {
    iconRef,
    indicatorRef,
    touchHandlers: {
      onTouchCancel: resetSwipe,
      onTouchEnd: finishSwipe,
      onTouchMove: moveSwipe,
      onTouchStart: startSwipe,
    },
  };
}
