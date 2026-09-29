"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { BackButton } from "../back-button";

/**
 * 상단 툴바처럼 화면에 고정된 뒤로가기 버튼. 스크롤해도, 아래로 당겨 돌아가는 동작 중에도 제자리에 있다.
 *
 * OverscrollBack의 스크롤 영역에는 transform이 걸려 있어 그 안의 fixed는 화면이 아니라 그 영역을 따라 움직인다.
 * 그래서 마운트되면 body로 옮긴다. 서버가 그린 첫 화면에서는 제자리에 그려 두어 버튼이 늦게 나타나지 않는다.
 */
export function PageBackButton({ fallbackHref }: { fallbackHref: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const layer = (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="mx-auto flex w-full max-w-(--app-width) px-5 pt-(--page-top)">
        <div className="pointer-events-auto">
          <BackButton fallbackHref={fallbackHref} />
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(layer, document.body) : layer;
}
