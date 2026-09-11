"use client";

import { type TouchEvent, useEffect, useRef } from "react";

import type { CircleChevronLeftIconHandle } from "@animateicons/react/lucide";

import { useGoBack } from "@/shared/lib/navigation/use-go-back";
import { useScrollRestoration } from "@/shared/lib/navigation/use-scroll-restoration";

import {
  getOverscrollBackProgress,
  isAtScrollEnd,
  OVERSCROLL_BACK_NAVIGATION_DELAY,
  OVERSCROLL_BACK_THRESHOLD,
} from "./overscroll-back";

type SwipeStart = { scrollDistanceToEnd: number; scrollY: number; x: number; y: number };

function getSwipeProgress(start: SwipeStart, touch: { clientX: number; clientY: number }, container: HTMLDivElement) {
  const scrollY = Math.max(0, container.scrollTop);
  const atScrollEnd = isAtScrollEnd(container.scrollHeight, container.clientHeight, scrollY);
  const consumedScrollDistance = Math.min(Math.max(0, scrollY - start.scrollY), start.scrollDistanceToEnd);
  return atScrollEnd
    ? getOverscrollBackProgress(start, { x: touch.clientX, y: touch.clientY }, consumedScrollDistance)
    : 0;
}

export function useOverscrollBack(fallbackHref: string) {
  const goBackTo = useGoBack();
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const progressRingRef = useRef<SVGCircleElement>(null);
  const completeIconRef = useRef<CircleChevronLeftIconHandle>(null);
  const touchStartRef = useRef<SwipeStart | null>(null);
  const readyRef = useRef(false);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotionRef = useRef(false);

  useScrollRestoration(containerRef);

  useEffect(() => {
    return () => {
      if (navigationTimerRef.current !== null) clearTimeout(navigationTimerRef.current);
    };
  }, []);

  const resetSwipe = () => {
    const indicator = indicatorRef.current;
    const icon = iconRef.current;
    const progressRing = progressRingRef.current;

    touchStartRef.current = null;
    readyRef.current = false;
    if (navigationTimerRef.current !== null) clearTimeout(navigationTimerRef.current);
    navigationTimerRef.current = null;
    completeIconRef.current?.stopAnimation();

    if (indicator) {
      indicator.dataset.dragging = "false";
      indicator.dataset.ready = "false";
      indicator.style.opacity = "0";
      indicator.style.transform = "translate3d(0, 24px, 0) scale(0.82)";
    }
    if (icon) icon.style.transform = "rotate(0deg)";
    if (progressRing) progressRing.style.strokeDashoffset = "1";
    if (containerRef.current) {
      containerRef.current.dataset.dragging = "false";
      containerRef.current.style.transform = "translate3d(0, 0, 0)";
      containerRef.current.style.willChange = "auto";
    }
  };

  const startSwipe = (event: TouchEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (event.touches.length !== 1) {
      resetSwipe();
      return;
    }
    if (!container) return;

    if (navigationTimerRef.current !== null) clearTimeout(navigationTimerRef.current);
    navigationTimerRef.current = null;

    const touch = event.touches[0];
    const scrollY = Math.max(0, container.scrollTop);
    const ready = readyRef.current;
    touchStartRef.current = {
      scrollDistanceToEnd: ready ? 0 : Math.max(0, container.scrollHeight - container.clientHeight - scrollY),
      scrollY,
      x: touch.clientX,
      y: touch.clientY + (ready ? OVERSCROLL_BACK_THRESHOLD : 0),
    };
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  const moveSwipe = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    const icon = iconRef.current;
    if (!start || !container || !indicator || !icon || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const progress = getSwipeProgress(start, touch, container);

    indicator.dataset.dragging = String(progress > 0);
    indicator.dataset.ready = String(progress === 1);
    indicator.style.opacity = String(Math.min(progress * 1.6, 1));
    indicator.style.transform = reduceMotionRef.current
      ? "translate3d(0, 0, 0) scale(1)"
      : `translate3d(0, ${(1 - progress) * 24}px, 0) scale(${0.82 + progress * 0.18})`;
    icon.style.transform = `rotate(${reduceMotionRef.current ? 90 : progress * 90}deg)`;
    if (progressRingRef.current) progressRingRef.current.style.strokeDashoffset = String(1 - progress);
    if (!reduceMotionRef.current) {
      container.dataset.dragging = String(progress > 0);
      container.style.transform = `translate3d(0, ${progress * -12}px, 0)`;
      container.style.willChange = progress > 0 ? "transform" : "auto";
    }

    if (progress === 1) {
      // 100%를 넘겨 당긴 거리까지 되돌리지 않아도 반대 방향에 즉시 반응한다.
      touchStartRef.current = {
        scrollDistanceToEnd: 0,
        scrollY: Math.max(0, container.scrollTop),
        x: touch.clientX,
        y: touch.clientY + OVERSCROLL_BACK_THRESHOLD,
      };
      indicator.dataset.dragging = "false";
      if (readyRef.current) return;
      readyRef.current = true;
    } else if (readyRef.current) {
      readyRef.current = false;
      completeIconRef.current?.stopAnimation();
    }
  };

  const finishSwipe = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    touchStartRef.current = null;
    if (event.touches.length > 0 || !readyRef.current) {
      resetSwipe();
      return;
    }

    if (!reduceMotionRef.current) completeIconRef.current?.startAnimation();

    navigationTimerRef.current = setTimeout(() => {
      // 이탈 확인에서 계속 작성을 선택해도 다음 스와이프를 받을 수 있게 한다.
      resetSwipe();
      goBackTo(fallbackHref);
    }, OVERSCROLL_BACK_NAVIGATION_DELAY);
  };

  return {
    containerRef,
    completeIconRef,
    iconRef,
    indicatorRef,
    progressRingRef,
    touchHandlers: {
      onTouchCancel: resetSwipe,
      onTouchEnd: finishSwipe,
      onTouchMove: moveSwipe,
      onTouchStart: startSwipe,
    },
  };
}
