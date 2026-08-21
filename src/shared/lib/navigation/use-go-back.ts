"use client";

import { useRouter } from "next/navigation";

/**
 * 왔던 화면으로 돌아간다. 히스토리가 없으면(새 탭에서 주소를 바로 연 경우) fallbackHref로 대신 간다.
 *
 * 헤더의 뒤로가기 버튼뿐 아니라 작성·수정·삭제가 끝났을 때도 이걸 쓴다.
 * 서버 액션의 redirect()는 기본이 push라 폼이 히스토리에 남아, 뒤로가기를 누르면 방금 제출한 폼이 다시 나온다.
 * replace로 바꿔도 출발지와 목적지가 같으면(목록 → 작성 → 목록) 같은 화면이 두 번 쌓여 뒤로가기가 한 번 안 먹힌다.
 * 왔던 곳으로 되돌아가는 것만 어느 경로에서 들어왔든 히스토리가 깨끗하다.
 *
 * history.length는 다른 사이트에서 링크를 타고 들어온 경우도 세지만, 공유 링크가 거의 없는 개인 앱이라 받아들인다.
 */
export function useGoBack() {
  const router = useRouter();

  return (fallbackHref: string) => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  };
}
