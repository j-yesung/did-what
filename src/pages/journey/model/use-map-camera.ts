"use client";

import { type MouseEvent, type PointerEvent, useEffect, useRef, useState, type WheelEvent } from "react";

import { type Box, clampViewWidth, constrainView, momentumView, national, toViewPoint, viewScale } from "./map-view";
import { prefersReducedMotion } from "./motion";

type Position = { x: number; y: number };

export const useMapCamera = () => {
  const [view, setViewState] = useState<Box>(national);
  const viewRef = useRef(view);
  const [viewport, setViewport] = useState({ width: 390, height: 844 });
  const svgRef = useRef<SVGSVGElement>(null);
  const animation = useRef(0);
  const pointers = useRef(new Map<number, Position>());
  const dragOrigin = useRef<Position | null>(null);
  const dragged = useRef(false);
  const dragEndAt = useRef(Number.NEGATIVE_INFINITY);
  const panSamples = useRef<(Position & { time: number })[]>([]);

  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) =>
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animation.current);
    };
  }, []);

  const stop = () => cancelAnimationFrame(animation.current);

  const setView = (next: Box) => {
    viewRef.current = next;
    setViewState(next);
  };

  const moveCamera = (next: Box) => {
    stop();
    const start = viewRef.current;
    const started = performance.now();
    if (prefersReducedMotion()) {
      setView(next);
      return;
    }

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 650);
      const eased = 1 - (1 - progress) ** 3;
      setView({
        x: start.x + (next.x - start.x) * eased,
        y: start.y + (next.y - start.y) * eased,
        width: start.width + (next.width - start.width) * eased,
        height: start.height + (next.height - start.height) * eased,
      });
      if (progress < 1) animation.current = requestAnimationFrame(tick);
    };
    animation.current = requestAnimationFrame(tick);
  };

  const toMapPoint = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    return rect ? toViewPoint(viewRef.current, rect, clientX, clientY) : null;
  };

  const zoomAt = (clientX: number, clientY: number, factor: number, panX = 0, panY = 0, elastic = false) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const current = viewRef.current;
    const scale = viewScale(current, rect);
    const anchor = toViewPoint(current, rect, clientX, clientY);
    const desired = current.width * factor;
    const limited = clampViewWidth(desired);
    const ratio = (elastic ? limited + (desired - limited) * 0.15 : limited) / current.width;
    setView(
      constrainView({
        x: anchor.x + (current.x - anchor.x) * ratio - panX * scale * ratio,
        y: anchor.y + (current.y - anchor.y) * ratio - panY * scale * ratio,
        width: current.width * ratio,
        height: current.height * ratio,
      }),
    );
  };

  const glide = (start: Box, velocity: Position, unit: number) => {
    const speed = Math.hypot(velocity.x, velocity.y) / unit;
    const started = performance.now();
    const tick = (now: number) => {
      const elapsed = now - started;
      setView(momentumView(start, velocity, elapsed));
      if (elapsed < 850 && speed * Math.exp(-elapsed / 180) > 0.015) animation.current = requestAnimationFrame(tick);
    };
    animation.current = requestAnimationFrame(tick);
  };

  const release = (event: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size) {
      panSamples.current = [];
      return;
    }

    const wasDragged = dragged.current;
    dragEndAt.current = wasDragged ? event.timeStamp : Number.NEGATIVE_INFINITY;
    dragged.current = false;

    const current = viewRef.current;
    const width = clampViewWidth(current.width);
    if (width !== current.width) {
      const height = (current.height * width) / current.width;
      moveCamera({
        x: current.x + (current.width - width) / 2,
        y: current.y + (current.height - height) / 2,
        width,
        height,
      });
      return;
    }
    if (!wasDragged || event.type === "pointercancel" || prefersReducedMotion()) return;

    const samples = panSamples.current;
    const first = samples[0];
    const last = samples.at(-1);
    if (!first || !last || last.time === first.time || event.timeStamp - last.time > 100) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const unit = viewScale(current, rect);
    const elapsed = last.time - first.time;
    const velocity = { x: ((last.x - first.x) / elapsed) * unit, y: ((last.y - first.y) / elapsed) * unit };
    if (Math.hypot(velocity.x, velocity.y) / unit >= 0.05) glide(current, velocity, unit);
  };

  const handlers = {
    onPointerDown: (event: PointerEvent<SVGSVGElement>) => {
      if (event.button !== 0) return;

      stop();
      if (pointers.current.size) dragged.current = true;
      else {
        dragOrigin.current = { x: event.clientX, y: event.clientY };
        dragged.current = false;
        panSamples.current = [{ x: event.clientX, y: event.clientY, time: event.timeStamp }];
      }
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    },
    onPointerMove: (event: PointerEvent<SVGSVGElement>) => {
      const tracked = pointers.current;
      if (!tracked.has(event.pointerId)) return;
      if (!event.buttons) {
        tracked.delete(event.pointerId);
        return;
      }

      const origin = dragOrigin.current;
      if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 6) dragged.current = true;
      if (dragged.current && !event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.setPointerCapture(event.pointerId);

      const [a, b] = [...tracked.values()];
      tracked.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const [nextA, nextB] = [...tracked.values()];
      if (!b) {
        panSamples.current = [
          ...panSamples.current.filter((sample) => event.timeStamp - sample.time <= 100),
          { x: event.clientX, y: event.clientY, time: event.timeStamp },
        ];
        zoomAt(0, 0, 1, nextA.x - a.x, nextA.y - a.y);
        return;
      }

      panSamples.current = [];
      const distance = Math.hypot(nextB.x - nextA.x, nextB.y - nextA.y);
      if (!distance || tracked.size > 2) return;

      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      zoomAt(
        midX,
        midY,
        Math.hypot(b.x - a.x, b.y - a.y) / distance,
        (nextA.x + nextB.x) / 2 - midX,
        (nextA.y + nextB.y) / 2 - midY,
        true,
      );
    },
    onPointerUp: release,
    onPointerCancel: release,
    onWheel: (event: WheelEvent<SVGSVGElement>) => {
      stop();
      zoomAt(event.clientX, event.clientY, Math.exp(event.deltaY * 0.001));
    },
  };

  const canTap = (event: MouseEvent) => !dragged.current && event.timeStamp - dragEndAt.current > 400;

  return {
    view,
    viewRef,
    viewport,
    unit: viewScale(view, viewport),
    svgRef,
    handlers,
    setView,
    moveCamera,
    stop,
    toMapPoint,
    canTap,
  };
};

export type MapCamera = ReturnType<typeof useMapCamera>;
