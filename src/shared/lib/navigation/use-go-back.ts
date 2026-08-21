"use client";

import { useRouter } from "next/navigation";

declare global {
  interface Window {
    /** Navigation API. TypeScript 5.9의 lib.dom에 아직 없어 쓰는 만큼만 선언한다. */
    navigation?: { canGoBack: boolean };
  }
}

/**
 * 뒤로 갈 같은 앱의 화면이 있는지.
 *
 * Navigation API는 같은 출처의 이어진 항목만 세므로 다른 사이트에서 링크를 타고 들어온 경우를 정확히 걸러낸다.
 * 없는 브라우저에서는 history.length로 어림한다. 이 값은 다른 사이트도 세지만 공유 링크가 거의 없는 개인 앱이라 받아들인다.
 */
export function canGoBack() {
  if (window.navigation) return window.navigation.canGoBack;
  return window.history.length > 1;
}

/**
 * 왔던 화면으로 돌아간다. 돌아갈 곳이 없으면(새 탭에서 주소를 바로 연 경우) fallbackHref로 대신 간다.
 *
 * 헤더의 뒤로가기 버튼뿐 아니라 작성·수정·삭제가 끝났을 때도 이걸 쓴다.
 * 서버 액션의 redirect()는 기본이 push라 폼이 히스토리에 남아, 뒤로가기를 누르면 방금 제출한 폼이 다시 나온다.
 * replace로 바꿔도 출발지와 목적지가 같으면(목록 → 작성 → 목록) 같은 화면이 두 번 쌓여 뒤로가기가 한 번 안 먹힌다.
 * 왔던 곳으로 되돌아가는 것만 어느 경로에서 들어왔든 히스토리가 깨끗하다.
 *
 * 앞으로가기에는 폼이 남는다. 앞으로가기 스택은 새 항목을 push할 때만 지워지는데, push하면 위의 중복 문제로 돌아간다.
 * 폼은 서버에서 현재 값을 다시 읽으니 잘못된 값이 보이지는 않는다.
 */
export function useGoBack() {
  const router = useRouter();

  return (fallbackHref: string) => {
    if (canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  };
}
