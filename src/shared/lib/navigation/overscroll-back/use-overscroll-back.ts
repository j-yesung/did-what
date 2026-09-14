"use client";

import { type TouchEvent, useEffect, useRef } from "react";

import { useGoBack } from "@/shared/lib/navigation/use-go-back";
import { useScrollRestoration } from "@/shared/lib/navigation/use-scroll-restoration";

import {
  getOverscrollBackDistance,
  isAtScrollEnd,
  OVERSCROLL_BACK_NAVIGATION_DELAY,
  OVERSCROLL_BACK_THRESHOLD,
} from "./overscroll-back";

type SwipeStart = { scrollDistanceToEnd: number; scrollY: number; x: number; y: number };
type SwipeVisual = { distance: number; progress: number };

const getSwipeDistance = (
  start: SwipeStart,
  touch: { clientX: number; clientY: number },
  container: HTMLDivElement,
) => {
  const scrollY = Math.max(0, container.scrollTop);
  const atScrollEnd = isAtScrollEnd(container.scrollHeight, container.clientHeight, scrollY);
  const consumedScrollDistance = Math.min(Math.max(0, scrollY - start.scrollY), start.scrollDistanceToEnd);
  return atScrollEnd
    ? getOverscrollBackDistance(start, { x: touch.clientX, y: touch.clientY }, consumedScrollDistance)
    : 0;
};

export const useOverscrollBack = (fallbackHref: string) => {
  const goBackTo = useGoBack();
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const progressRingRef = useRef<SVGCircleElement>(null);
  const visualStartRef = useRef<SwipeStart | null>(null);
  const distanceRef = useRef(0);
  const touchStartRef = useRef<SwipeStart | null>(null);
  const readyRef = useRef(false);
  const visualFrameRef = useRef<number | null>(null);
  const pendingVisualRef = useRef<SwipeVisual | null>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotionRef = useRef(false);

  useScrollRestoration(containerRef);

  useEffect(() => {
    return () => {
      if (visualFrameRef.current !== null) cancelAnimationFrame(visualFrameRef.current);
      if (navigationTimerRef.current !== null) clearTimeout(navigationTimerRef.current);
    };
  }, []);

  const resetSwipe = () => {
    const indicator = indicatorRef.current;
    const icon = iconRef.current;
    const progressRing = progressRingRef.current;

    touchStartRef.current = null;
    visualStartRef.current = null;
    distanceRef.current = 0;
    readyRef.current = false;
    pendingVisualRef.current = null;
    if (visualFrameRef.current !== null) cancelAnimationFrame(visualFrameRef.current);
    visualFrameRef.current = null;
    if (navigationTimerRef.current !== null) clearTimeout(navigationTimerRef.current);
    navigationTimerRef.current = null;

    if (indicator) {
      indicator.dataset.dragging = "false";
      indicator.dataset.ready = "false";
      indicator.style.opacity = "0";
      indicator.style.transform = reduceMotionRef.current ? "translate3d(0, 0, 0)" : "translate3d(0, 24px, 0)";
    }
    if (icon) icon.style.transform = "rotate(0deg)";
    if (progressRing) {
      progressRing.style.opacity = "0";
      progressRing.style.strokeDashoffset = "1";
      progressRing.style.transform = "rotate(90deg)";
    }
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
    visualStartRef.current = {
      ...touchStartRef.current,
      y: touch.clientY + distanceRef.current,
    };
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  const updateSwipeVisual = () => {
    visualFrameRef.current = null;
    const visual = pendingVisualRef.current;
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    const icon = iconRef.current;
    const progressRing = progressRingRef.current;
    if (!visual || !container || !indicator || !icon || !progressRing) return;
    pendingVisualRef.current = null;

    const { distance, progress } = visual;
    const dragging = String(progress > 0);
    const ready = String(progress === 1);
    const ringProgress = Math.max(0, (progress - 0.35) / 0.65);
    const travel = 160 * (1 - Math.exp(-distance / 360));

    if (indicator.dataset.dragging !== dragging) indicator.dataset.dragging = dragging;
    if (indicator.dataset.ready !== ready) indicator.dataset.ready = ready;
    if (container.dataset.dragging !== dragging) container.dataset.dragging = dragging;
    indicator.style.opacity = String(Math.min(progress * 5, 1));
    indicator.style.transform = reduceMotionRef.current
      ? "translate3d(0, 0, 0)"
      : `translate3d(0, ${24 - travel}px, 0)`;
    icon.style.transform = `rotate(${reduceMotionRef.current ? (progress === 1 ? 90 : 0) : ringProgress * 90}deg)`;
    progressRing.style.opacity = String(ringProgress > 0 ? 1 : 0);
    progressRing.style.strokeDashoffset = String(1 - ringProgress);
    progressRing.style.transform = `rotate(${90 - ringProgress * 180}deg)`;
    container.style.transform = `translate3d(0, ${reduceMotionRef.current ? 0 : -travel}px, 0)`;
  };

  const moveSwipe = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const container = containerRef.current;
    if (!start || !container || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const progress = Math.min(getSwipeDistance(start, touch, container) / OVERSCROLL_BACK_THRESHOLD, 1);
    const distance = getSwipeDistance(visualStartRef.current ?? start, touch, container);
    distanceRef.current = distance;
    pendingVisualRef.current = { distance, progress };
    if (progress > 0 && !reduceMotionRef.current && container.style.willChange !== "transform") {
      container.style.willChange = "transform";
    }
    if (visualFrameRef.current === null) visualFrameRef.current = requestAnimationFrame(updateSwipeVisual);

    if (progress === 1) {
      // 100%를 넘겨 당긴 거리까지 되돌리지 않아도 반대 방향에 즉시 반응한다.
      touchStartRef.current = {
        scrollDistanceToEnd: 0,
        scrollY: Math.max(0, container.scrollTop),
        x: touch.clientX,
        y: touch.clientY + OVERSCROLL_BACK_THRESHOLD,
      };
      if (readyRef.current) return;
      readyRef.current = true;
    } else if (readyRef.current) {
      readyRef.current = false;
    }
  };

  const finishSwipe = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    touchStartRef.current = null;
    if (event.touches.length > 0 || !readyRef.current) {
      resetSwipe();
      return;
    }

    navigationTimerRef.current = setTimeout(() => {
      // 이탈 확인에서 계속 작성을 선택해도 다음 스와이프를 받을 수 있게 한다.
      resetSwipe();
      goBackTo(fallbackHref);
    }, OVERSCROLL_BACK_NAVIGATION_DELAY);
  };

  return {
    containerRef,
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
};
