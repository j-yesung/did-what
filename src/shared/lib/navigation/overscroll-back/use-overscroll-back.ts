"use client";

import { type TouchEvent, useRef } from "react";

import { useGoBack } from "@/shared/lib/navigation/use-go-back";

import { getOverscrollBackProgress, isAtScrollEnd } from "./overscroll-back";

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
  const touchStartRef = useRef<SwipeStart | null>(null);
  const swipeProgressRef = useRef(0);
  const navigatingRef = useRef(false);
  const reduceMotionRef = useRef(false);

  const resetSwipe = () => {
    const indicator = indicatorRef.current;
    const icon = iconRef.current;
    const progressRing = progressRingRef.current;

    touchStartRef.current = null;
    swipeProgressRef.current = 0;

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
    if (!container || navigatingRef.current || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const scrollY = Math.max(0, container.scrollTop);
    touchStartRef.current = {
      scrollDistanceToEnd: Math.max(0, container.scrollHeight - container.clientHeight - scrollY),
      scrollY,
      x: touch.clientX,
      y: touch.clientY,
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
    swipeProgressRef.current = progress;

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
  };

  const finishSwipe = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;

    if (event.touches.length > 0 || swipeProgressRef.current < 1) {
      resetSwipe();
      return;
    }

    touchStartRef.current = null;
    navigatingRef.current = true;
    goBackTo(fallbackHref);
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
}
