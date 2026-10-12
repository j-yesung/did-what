import { QueryClient, type QueryKey } from "@tanstack/react-query";

type ResolveQuery = (queryKey: QueryKey, pageParam: unknown, queryHash: string) => Promise<unknown>;

/**
 * 데모 전용 QueryClient. 화면은 실제 queryOptions를 그대로 쓰고, 조회 함수만 샘플 데이터 조회로 바뀐다.
 * 실제 사용자 캐시와 다른 인스턴스라 서로 섞이지 않는다.
 *
 * ponytail: 공개 메서드 defaultQueryOptions를 감싸 queryFn을 바꾼다. TanStack Query가 이 경로를 바꾸면 여기를 고친다.
 */
export const createDemoQueryClient = (resolve: ResolveQuery) => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { refetchOnWindowFocus: false, retry: false } },
  });
  const defaultQueryOptions = client.defaultQueryOptions.bind(client);

  client.defaultQueryOptions = ((options) => {
    const defaulted = defaultQueryOptions(options);
    return {
      ...defaulted,
      queryFn: ({ pageParam, queryKey }: { pageParam?: unknown; queryKey: QueryKey }) =>
        resolve(queryKey, pageParam, defaulted.queryHash),
      // 체험 패널을 누를 때마다 iframe 포커스가 바뀐다. 그때마다 다시 받으면 오류 상태 재현이 흐트러진다.
      refetchOnWindowFocus: false,
      retry: false,
    };
  }) as typeof client.defaultQueryOptions;

  return client;
};
