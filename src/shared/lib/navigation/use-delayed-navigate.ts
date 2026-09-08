"use client";

import type { MouseEvent } from "react";

import { useRouter } from "next/navigation";

// 이동하기 전에 눌림이 풀리는 걸 보여주는 시간.
const RELEASE_DELAY = 180;

// 목록 항목을 눌러 다음 화면으로 갈 때, 눌림이 풀리는 걸 보여준 뒤에 이동한다.
export function useDelayedNavigate() {
  const router = useRouter();

  return (event: MouseEvent<HTMLElement>, href: string) => {
    // 새 탭·새 창으로 여는 클릭은 브라우저에 맡긴다.
    if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    event.preventDefault();
    setTimeout(() => router.push(href), RELEASE_DELAY);
  };
}
