"use client";

import { useEffect } from "react";

/**
 * 이 거리를 넘게 움직이면 누른 게 아니라 끈 것으로 본다.
 * 손가락은 가만히 눌러도 몇 px씩 흔들려서 너무 작게 잡으면 제자리 탭이 취소된다.
 */
const DRAG_THRESHOLD = 10;

/**
 * `data-press`가 붙은 요소의 누름 상태를 `data-press="on"`으로 표시한다. 앱에 한 번만 올린다.
 *
 * CSS `:active`는 스크롤을 시작하려고 손가락을 댄 것과 진짜 탭을 구분하지 못한다.
 * 그래서 목록을 훑을 때마다 손가락이 닿은 카드가 한 번 움찔한다.
 * 브라우저는 스크롤·팬 제스처로 판정한 순간 `pointercancel`을 보내므로, 이걸 받으면 눌림을 거둔다.
 * 요소 위에서 그냥 끄는 경우는 `pointercancel`이 안 오니 이동 거리로 따로 걸러낸다.
 *
 * 요소마다 훅을 부르지 않고 문서 하나에 위임한 이유는 두 가지다.
 * 목록 항목은 `map()` 안에서 그려져 훅을 부를 자리가 없고, 누름 표시는 화면에만 보이면 되는 값이라
 * 리렌더까지 일으킬 필요가 없다.
 */
export function PressListener() {
  useEffect(() => {
    let target: Element | null = null;
    let startX = 0;
    let startY = 0;

    const release = () => {
      target?.setAttribute("data-press", "");
      target = null;
    };

    const press = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      target = event.target.closest("[data-press]");
      if (!target) return;
      startX = event.clientX;
      startY = event.clientY;
      target.setAttribute("data-press", "on");
    };

    const drag = (event: PointerEvent) => {
      if (!target) return;
      if (Math.hypot(event.clientX - startX, event.clientY - startY) > DRAG_THRESHOLD) release();
    };

    // 기본 동작을 막지 않으므로 passive로 붙여 스크롤을 방해하지 않는다.
    const options = { passive: true } as const;
    document.addEventListener("pointerdown", press, options);
    document.addEventListener("pointermove", drag, options);
    document.addEventListener("pointerup", release, options);
    document.addEventListener("pointercancel", release, options);

    return () => {
      document.removeEventListener("pointerdown", press);
      document.removeEventListener("pointermove", drag);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
    };
  }, []);

  return null;
}
