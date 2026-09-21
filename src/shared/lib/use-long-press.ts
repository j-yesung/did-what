"use client";

import { type PointerEvent as ReactPointerEvent, useEffect, useRef } from "react";

const LONG_PRESS_MS = 300;

const MOVE_THRESHOLD = 10;

export const swallowNextClick = () => {
  const stop = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  window.addEventListener("click", stop, { capture: true, once: true });
  // 손을 떼는 방식에 따라 click이 아예 오지 않는다. 남겨두면 엉뚱한 다음 클릭을 먹으므로 시간으로도 건다.
  window.setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 400);
};

/**
 * 요소를 꾹 눌렀을 때 한 번 호출한다. 돌려받은 핸들러를 요소에 그대로 펼쳐 넣는다.
 *
 * 링크 위에서도 쓸 수 있도록 눌림이 끝난 뒤 따라오는 click을 막는다.
 * 눌림 표시(data-press)는 PressListener가 따로 처리하므로 여기서는 건드리지 않는다.
 */
export const useLongPress = (onLongPress?: () => void) => {
  const timer = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  const clear = () => {
    if (timer.current === null) return;
    window.clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  if (!onLongPress) return {};

  return {
    onPointerCancel: clear,
    onPointerDown: (event: ReactPointerEvent) => {
      if (event.button !== 0) return;
      origin.current = { x: event.clientX, y: event.clientY };
      clear();
      timer.current = window.setTimeout(() => {
        timer.current = null;
        swallowNextClick();
        onLongPress();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (event: ReactPointerEvent) => {
      if (timer.current === null) return;
      const moved = Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y);
      if (moved > MOVE_THRESHOLD) clear();
    },
    onPointerUp: clear,
  };
};
