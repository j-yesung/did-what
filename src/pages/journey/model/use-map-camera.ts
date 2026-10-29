"use client";

import {
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type WheelEvent,
} from "react";

import {
  type Box,
  clampViewWidth,
  constrainView,
  type Frame,
  followBox,
  momentumView,
  national,
  routeBox,
  toViewPoint,
  viewScale,
  viewTransform,
} from "./map-view";
import { prefersReducedMotion } from "./motion";
import type { JourneyRoute } from "./types";

type Position = { x: number; y: number };

export const MAP_OVERSCAN = 1.5;

export const useMapCamera = () => {
  const [view, setViewState] = useState<Box>(national);
  const viewRef = useRef(view);
  const rendered = useRef(view);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewport, setViewport] = useState({ width: 390, height: 844 });
  const viewportRef = useRef(viewport);
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const animation = useRef(0);
  const settled = useRef<(() => void) | null>(null);
  const pointers = useRef(new Map<number, Position>());
  const dragOrigin = useRef<Position | null>(null);
  const dragged = useRef(false);
  const dragEndAt = useRef(Number.NEGATIVE_INFINITY);
  const panSamples = useRef<(Position & { time: number })[]>([]);

  const applyTransform = () => {
    const layer = layerRef.current;
    if (!layer) return null;

    if (viewRef.current === rendered.current) {
      layer.style.transform = "";
      layer.style.removeProperty("--map-scale");
      return null;
    }
    const shift = viewTransform(rendered.current, viewRef.current, viewportRef.current);
    layer.style.transform = `translate(${shift.x}px, ${shift.y}px) scale(${shift.scale})`;
    layer.style.setProperty("--map-scale", `${shift.scale}`);
    return shift;
  };

  useLayoutEffect(() => {
    rendered.current = view;
    applyTransform();
  });

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      viewportRef.current = { width: entry.contentRect.width, height: entry.contentRect.height };
      setViewport(viewportRef.current);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animation.current);
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      settled.current?.();
    };
  }, []);

  const commit = () => {
    if (viewRef.current !== rendered.current) setViewState(viewRef.current);
  };

  const preview = (next: Box) => {
    viewRef.current = next;
    const shift = applyTransform();
    if (!shift) return;

    const { width, height } = viewportRef.current;
    const drift = 2 * Math.max(Math.abs(shift.x) / width, Math.abs(shift.y) / height);
    if (shift.scale > 1.6 || MAP_OVERSCAN * shift.scale < 1.2 + drift) commit();
  };

  const stop = () => {
    cancelAnimationFrame(animation.current);
    settled.current?.();
    settled.current = null;
    commit();
  };

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
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      settled.current = resolve;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / 650);
        const eased = 1 - (1 - progress) ** 3;
        preview({
          x: start.x + (next.x - start.x) * eased,
          y: start.y + (next.y - start.y) * eased,
          width: start.width + (next.width - start.width) * eased,
          height: start.height + (next.height - start.height) * eased,
        });
        if (progress < 1) animation.current = requestAnimationFrame(tick);
        else {
          settled.current = null;
          commit();
          resolve();
        }
      };
      animation.current = requestAnimationFrame(tick);
    });
  };

  const frame = (): Frame | undefined => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return undefined;

    const header = headerRef.current?.getBoundingClientRect();
    const panel = panelRef.current?.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      top: header ? header.bottom - rect.top : 0,
      bottom: panel ? rect.bottom - panel.top : 0,
    };
  };

  const fitRoutes = (routes: JourneyRoute[]) => routeBox(routes, frame());

  const followRoute = (route: JourneyRoute) => followBox(viewRef.current, route, frame());

  const toMapPoint = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    return rect ? toViewPoint(viewRef.current, rect, clientX, clientY) : null;
  };

  const zoomAt = (clientX: number, clientY: number, factor: number, panX = 0, panY = 0, elastic = false) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const current = viewRef.current;
    const scale = viewScale(current, rect);
    const anchor = toViewPoint(current, rect, clientX, clientY);
    const desired = current.width * factor;
    const limited = clampViewWidth(desired);
    const ratio = (elastic ? limited + (desired - limited) * 0.15 : limited) / current.width;
    preview(
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
      preview(momentumView(start, velocity, elapsed));
      if (elapsed < 850 && speed * Math.exp(-elapsed / 180) > 0.015) animation.current = requestAnimationFrame(tick);
      else commit();
    };
    animation.current = requestAnimationFrame(tick);
  };

  const release = (event: PointerEvent<HTMLDivElement>) => {
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
    const samples = panSamples.current;
    const first = samples[0];
    const last = samples.at(-1);
    const unit = viewScale(current, viewportRef.current);
    const elapsed = first && last ? last.time - first.time : 0;
    const velocity =
      first && last && elapsed
        ? { x: ((last.x - first.x) / elapsed) * unit, y: ((last.y - first.y) / elapsed) * unit }
        : { x: 0, y: 0 };
    const gliding =
      wasDragged &&
      event.type !== "pointercancel" &&
      !prefersReducedMotion() &&
      last !== undefined &&
      event.timeStamp - last.time <= 100 &&
      Math.hypot(velocity.x, velocity.y) / unit >= 0.05;
    if (gliding) glide(current, velocity, unit);
    else commit();
  };

  const handlers = {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
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
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
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
    onWheel: (event: WheelEvent<HTMLDivElement>) => {
      cancelAnimationFrame(animation.current);
      zoomAt(event.clientX, event.clientY, Math.exp(event.deltaY * 0.001));
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(commit, 150);
    },
  };

  const canTap = (event: MouseEvent) => !dragged.current && event.timeStamp - dragEndAt.current > 400;

  return {
    view,
    viewRef,
    viewport,
    unit: viewScale(view, viewport),
    stageRef,
    layerRef,
    headerRef,
    panelRef,
    handlers,
    setView,
    moveCamera,
    stop,
    toMapPoint,
    canTap,
    fitRoutes,
    followRoute,
  };
};

export type MapCamera = ReturnType<typeof useMapCamera>;
