import { QueryClient } from "@tanstack/react-query";

/**
 * 조회 기본값. 개별 query가 필요하면 덮어쓴다.
 * 이 앱의 화면 데이터는 대부분 Server Component가 그리므로, 여기 값은 클라이언트 조회에만 적용된다.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
