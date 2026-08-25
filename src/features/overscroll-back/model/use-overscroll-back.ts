"use client";

import { type TouchEvent, useRef } from "react";

import { useGoBack } from "@/shared/lib/navigation/use-go-back";

import { getOverscrollBackProgress, isAtScrollEnd } from "./overscroll-back";

export function useOverscrollBack(fallbackHref: string) {
  const goBackTo = useGoBack();
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const progressRingRef = useRef<SVGCircleElement>(null);
  const touchStartRef = useRef<{ scrollDistanceToEnd: number; scrollY: number; x: number; y: number } | null>(null);
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
    if (navigatingRef.current || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const scrollY = Math.max(0, window.scrollY);
    touchStartRef.current = {
      scrollDistanceToEnd: Math.max(0, document.documentElement.scrollHeight - window.innerHeight - scrollY),
      scrollY,
      x: touch.clientX,
      y: touch.clientY,
    };
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  const moveSwipe = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const indicator = indicatorRef.current;
    const icon = iconRef.current;
    if (!start || !indicator || !icon || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const atScrollEnd = isAtScrollEnd(document.documentElement.scrollHeight, window.innerHeight, window.scrollY);
    const consumedScrollDistance = Math.min(Math.max(0, window.scrollY - start.scrollY), start.scrollDistanceToEnd);
    const progress = atScrollEnd
      ? getOverscrollBackProgress(start, { x: touch.clientX, y: touch.clientY }, consumedScrollDistance)
      : 0;
    swipeProgressRef.current = progress;

    indicator.dataset.dragging = String(progress > 0);
    indicator.dataset.ready = String(progress === 1);
    indicator.style.opacity = String(Math.min(progress * 1.6, 1));
    indicator.style.transform = reduceMotionRef.current
      ? "translate3d(0, 0, 0) scale(1)"
      : `translate3d(0, ${(1 - progress) * 24}px, 0) scale(${0.82 + progress * 0.18})`;
    icon.style.transform = `rotate(${reduceMotionRef.current ? 90 : progress * 90}deg)`;
    if (progressRingRef.current) progressRingRef.current.style.strokeDashoffset = String(1 - progress);
    if (containerRef.current && !reduceMotionRef.current) {
      containerRef.current.dataset.dragging = String(progress > 0);
      containerRef.current.style.transform = `translate3d(0, ${progress * -12}px, 0)`;
      containerRef.current.style.willChange = progress > 0 ? "transform" : "auto";
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
    // 손을 뗀 뒤의 관성이 복원된 이전 화면까지 이어지지 않도록 현재 문서 끝에서 끊는다.
    window.scrollTo(window.scrollX, Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
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
