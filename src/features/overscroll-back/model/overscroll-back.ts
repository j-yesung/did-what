export const OVERSCROLL_BACK_THRESHOLD = 120;
const SCROLL_END_TOLERANCE = 4;

type TouchPoint = { x: number; y: number };

export function getOverscrollBackProgress(start: TouchPoint, current: TouchPoint) {
  const upwardDistance = start.y - current.y;
  const horizontalDistance = Math.abs(start.x - current.x);

  if (upwardDistance <= horizontalDistance) return 0;
  return Math.min(upwardDistance / OVERSCROLL_BACK_THRESHOLD, 1);
}

export function isAtScrollEnd(scrollHeight: number, viewportHeight: number, scrollY: number) {
  const scrollEnd = Math.max(0, scrollHeight - viewportHeight);
  return scrollEnd - Math.max(0, scrollY) <= SCROLL_END_TOLERANCE;
}
