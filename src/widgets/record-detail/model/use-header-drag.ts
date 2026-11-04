import { type PointerEvent, useEffect, useRef } from "react";

const SHRINK_LIMIT = 240;
const SHRINK_RATE = 1600;
const RUBBER_FROM = 180;
const CLOSE_DISTANCE = 96;
const FLICK_DISTANCE = 20;
const FLICK_VELOCITY = 0.55;
const STIFFNESS = 100;
const DAMPING = 10;

type Drag = {
  distance: number;
  horizontal: number;
  id: number;
  lastAt: number;
  lastY: number;
  start: number;
  velocity: number;
  x: number;
  y: number;
};

const isReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useHeaderDrag = (onDismiss: () => void) => {
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

  const end = (event: PointerEvent<HTMLElement>, cancelled: boolean) => {
    const gesture = drag.current;
    if (!gesture || event.pointerId !== gesture.id) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    const velocity = performance.now() - gesture.lastAt > 100 ? 0 : gesture.velocity;
    const downward = gesture.distance > 0 && gesture.distance > Math.abs(gesture.horizontal);
    const dismiss =
      gesture.distance >= CLOSE_DISTANCE || (gesture.distance >= FLICK_DISTANCE && velocity > FLICK_VELOCITY);
    if (!cancelled && downward && dismiss) onDismiss();
    else springBack(cancelled ? 0 : velocity);
  };

  return {
    onLostPointerCapture: (event: PointerEvent<HTMLElement>) => end(event, true),
    onPointerCancel: (event: PointerEvent<HTMLElement>) => end(event, true),
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (drag.current || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      stopSpring();
      sheet.current = event.currentTarget.closest("[data-record-sheet]");
      const now = performance.now();
      drag.current = {
        distance: 0,
        horizontal: 0,
        id: event.pointerId,
        lastAt: now,
        lastY: event.clientY,
        start: offset.current,
        velocity: 0,
        x: event.clientX,
        y: event.clientY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const gesture = drag.current;
      if (!gesture || event.pointerId !== gesture.id) return;
      const now = performance.now();
      const elapsed = now - gesture.lastAt;
      if (elapsed > 0) gesture.velocity = (event.clientY - gesture.lastY) / elapsed;
      gesture.lastY = event.clientY;
      gesture.lastAt = now;
      gesture.distance = event.clientY - gesture.y;
      gesture.horizontal = event.clientX - gesture.x;
      const distance = gesture.start + gesture.distance;
      paint(
        distance < 0
          ? distance * 0.12
          : distance > RUBBER_FROM
            ? RUBBER_FROM + (distance - RUBBER_FROM) * 0.25
            : distance,
      );
      event.preventDefault();
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => end(event, false),
  };
};
