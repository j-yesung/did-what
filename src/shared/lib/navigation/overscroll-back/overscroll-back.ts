export const OVERSCROLL_BACK_THRESHOLD = 180;
/** 손을 뗀 뒤 완료 아이콘이 도는 동안 화면을 멈춰 두는 시간. 아이콘 재생 시간과 같은 값을 쓴다. */
export const OVERSCROLL_BACK_NAVIGATION_DELAY = 300;
/** 뒤로가기가 일어나지 않았을 때(이탈 확인 등) 당긴 화면을 되돌리기까지 기다리는 시간. */
export const OVERSCROLL_BACK_LIFT_RELEASE_DELAY = 500;
const SCROLL_END_TOLERANCE = 4;

type TouchPoint = { x: number; y: number };

export const getOverscrollBackDistance = (start: TouchPoint, current: TouchPoint, consumedScrollDistance = 0) => {
  const upwardDistance = start.y - current.y;
  const horizontalDistance = Math.abs(start.x - current.x);

  if (upwardDistance <= horizontalDistance) return 0;
  return Math.max(0, upwardDistance - Math.max(0, consumedScrollDistance));
};

export const getOverscrollBackProgress = (start: TouchPoint, current: TouchPoint, consumedScrollDistance = 0) =>
  Math.min(getOverscrollBackDistance(start, current, consumedScrollDistance) / OVERSCROLL_BACK_THRESHOLD, 1);

export const isAtScrollEnd = (scrollHeight: number, viewportHeight: number, scrollY: number) => {
  const scrollEnd = Math.max(0, scrollHeight - viewportHeight);
  return scrollEnd - Math.max(0, scrollY) <= SCROLL_END_TOLERANCE;
};
