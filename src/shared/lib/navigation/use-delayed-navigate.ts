"use client";

import type { MouseEvent } from "react";

import { useRouter } from "next/navigation";

/**
 * 이동하기 전에 눌림이 풀리는 걸 보여주는 시간.
 *
 * 복귀 커브가 앞쪽에 몰려 있어 350ms를 다 기다리지 않아도 이만큼이면 제자리로 돌아온 것처럼 보인다.
 * 늘리면 탭이 굼떠지고, 0으로 두면 눌린 화면이 그대로 히스토리 스냅샷에 남는다.
 */
const RELEASE_DELAY = 180;

/**
 * 목록 항목을 눌러 다음 화면으로 갈 때, 눌림이 풀리는 걸 보여준 뒤에 이동한다.
 *
 * `:active`는 touchend와 같은 태스크에서 풀리고 그 태스크 안에서 라우팅까지 끝난다.
 * 라우터는 커밋 중(`useInsertionEffect`)에 히스토리 항목을 만들므로, 그사이 복귀 트랜지션은 한 프레임도 그려지지 않는다.
 * 브라우저는 마지막으로 그린 화면을 그 항목의 스냅샷으로 저장하니 눌린 목록이 그대로 저장되고,
 * 뒤로 돌아오면 눌린 화면을 먼저 보여준 뒤 실제 화면으로 바뀌어 누른 항목이 저 혼자 튀어오른 것처럼 보인다.
 */
export function useDelayedNavigate() {
  const router = useRouter();

  return (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    // 새 탭·새 창으로 여는 클릭은 브라우저에 맡긴다.
    if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    event.preventDefault();
    setTimeout(() => router.push(href), RELEASE_DELAY);
  };
}
