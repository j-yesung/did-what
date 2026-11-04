import { type PointerEvent, useEffect, useEffectEvent, useRef } from "react";

const SHRINK_LIMIT = 240;
const SHRINK_RATE = 1600;
const RUBBER_FROM = 180;
const CLOSE_DISTANCE = 96;
const FLICK_DISTANCE = 20;
const FLICK_VELOCITY = 0.55;
const STIFFNESS = 100;
const DAMPING = 10;
const HEADER = "[data-record-drag-header]";
const CONTROLS = "button, a, input, textarea, select, [contenteditable]:not([contenteditable=false])";

type Point = { clientX: number; clientY: number };
type Drag = {
  active: boolean;
  body: boolean;
  distance: number;
  horizontal: number;
  id: number;
  lastAt: number;
  lastY: number;
  start: number;
  touch: boolean;
  velocity: number;
  x: number;
  y: number;
};

const isReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useRecordSheetDrag = (onDismiss: () => void, enabled: boolean) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<Drag | null>(null);
  const offset = useRef(0);
  const frame = useRef(0);
  const sheet = useRef<HTMLElement | null>(null);

  const paint = (y: number) => {
    offset.current = y;
    const element = sheet.current;
    if (!element) return;
    if (y === 0) {
      element.style.transform = "";
      element.style.transformOrigin = "";
      element.style.transition = "";
      return;
    }
    const scale = isReduced() ? 1 : 1 - Math.min(SHRINK_LIMIT, Math.max(0, y)) / SHRINK_RATE;
    element.style.transition = "none";
    element.style.transformOrigin = "50% 0";
    element.style.transform = `translateY(${y}px) scale(${scale})`;
  };

  const stopSpring = () => cancelAnimationFrame(frame.current);

  const springBack = (velocity: number) => {
    stopSpring();
    if (isReduced()) return paint(0);
    let previous = performance.now();
    let speed = velocity * 1000;
    const step = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.001, (now - previous) / 1000));
      previous = now;
      speed += (-STIFFNESS * offset.current - DAMPING * speed) * dt;
      paint(offset.current + speed * dt);
      if (Math.abs(offset.current) < 0.2 && Math.abs(speed) < 2) paint(0);
      else frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const start = (point: Point, id: number, body: boolean, touch = false) => {
    stopSpring();
    sheet.current = scrollRef.current?.closest("[data-record-sheet]") ?? null;
    drag.current = {
      active: !body,
      body,
      distance: 0,
      horizontal: 0,
      id,
      lastAt: performance.now(),
      lastY: point.clientY,
      start: offset.current,
      touch,
      velocity: 0,
      x: point.clientX,
      y: point.clientY,
    };
  };

  const move = (point: Point) => {
    const gesture = drag.current;
    if (!gesture) return false;
    const distance = point.clientY - gesture.y;
    const horizontal = point.clientX - gesture.x;
    if (!gesture.active) {
      if ((scrollRef.current?.scrollTop ?? 0) > 0 || distance <= 0) {
        // 스크롤로 소비한 거리는 닫기 거리와 속도에 포함하지 않는다.
        start(point, gesture.id, true, gesture.touch);
        return false;
      }
      if (distance < 4 || distance <= Math.abs(horizontal)) return false;
      gesture.active = true;
    }
    const now = performance.now();
    const elapsed = now - gesture.lastAt;
    if (elapsed > 0) gesture.velocity = (point.clientY - gesture.lastY) / elapsed;
    gesture.lastY = point.clientY;
    gesture.lastAt = now;
    gesture.distance = distance;
    gesture.horizontal = horizontal;
    const travel = gesture.start + distance;
    paint(travel < 0 ? travel * 0.12 : travel > RUBBER_FROM ? RUBBER_FROM + (travel - RUBBER_FROM) * 0.25 : travel);
    return true;
  };

  const finish = (cancelled: boolean) => {
    const gesture = drag.current;
    drag.current = null;
    if (!gesture?.active) return;
    const velocity = performance.now() - gesture.lastAt > 100 ? 0 : gesture.velocity;
    const downward = gesture.distance > 0 && gesture.distance > Math.abs(gesture.horizontal);
    const dismiss =
      gesture.distance >= CLOSE_DISTANCE || (gesture.distance >= FLICK_DISTANCE && velocity > FLICK_VELOCITY);
    if (!cancelled && downward && dismiss) onDismiss();
    else springBack(cancelled ? 0 : velocity);
  };

  const endPointer = (event: PointerEvent<HTMLElement>, cancelled: boolean) => {
    if (drag.current?.touch) return;
    if (drag.current?.id !== event.pointerId) return;
    finish(cancelled);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const touchStart = useEffectEvent((event: TouchEvent) => {
    if (event.touches.length !== 1) {
      finish(true);
      return;
    }
    const target = event.target;
    if (drag.current || !(target instanceof Element) || target.closest(`${HEADER}, ${CONTROLS}`)) return;
    if (target.closest("[data-record-scroll]") !== scrollRef.current) return;
    const touch = event.touches[0];
    start(touch, touch.identifier, true, true);
  });
  const touchMove = useEffectEvent((event: TouchEvent) => {
    if (event.touches.length !== 1) return finish(true);
    const touch = event.touches[0];
    if (!drag.current?.touch || touch.identifier !== drag.current.id) return;
    if (!event.cancelable) return finish(true);
    if (move(touch)) event.preventDefault();
  });
  const touchEnd = useEffectEvent((event: TouchEvent) => {
    if (!drag.current?.touch) return;
    if (Array.from(event.changedTouches).some((touch) => touch.identifier === drag.current?.id)) {
      finish(event.type === "touchcancel");
    }
  });

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!enabled || !scroll) return;
    const startTouch = (event: TouchEvent) => touchStart(event);
    const moveTouch = (event: TouchEvent) => touchMove(event);
    const endTouch = (event: TouchEvent) => touchEnd(event);
    // React의 위임된 touchmove는 passive이므로 네이티브 리스너로 맨 위에서만 스크롤을 가로챈다.
    scroll.addEventListener("touchstart", startTouch, { passive: true });
    scroll.addEventListener("touchmove", moveTouch, { passive: false });
    scroll.addEventListener("touchend", endTouch);
    scroll.addEventListener("touchcancel", endTouch);
    return () => {
      scroll.removeEventListener("touchstart", startTouch);
      scroll.removeEventListener("touchmove", moveTouch);
      scroll.removeEventListener("touchend", endTouch);
      scroll.removeEventListener("touchcancel", endTouch);
    };
  }, [enabled]);

  return {
    scrollRef,
    handlers: {
      onLostPointerCapture: (event: PointerEvent<HTMLElement>) => endPointer(event, true),
      onPointerCancel: (event: PointerEvent<HTMLElement>) => endPointer(event, true),
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (!enabled || drag.current || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0))
          return;
        const target = event.target;
        if (!(target instanceof Element) || target.closest(CONTROLS)) return;
        const body = !target.closest(HEADER);
        if (body && event.pointerType === "touch") return;
        if (body && (scrollRef.current?.scrollTop ?? 0) > 0) return;
        start(event, event.pointerId, body);
        if (!body) event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType === "touch" && drag.current?.body) return;
        if (drag.current?.id !== event.pointerId || !move(event)) return;
        if (!event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
      },
      onPointerUp: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType === "touch" && drag.current?.body) return;
        endPointer(event, false);
      },
    },
  };
};
