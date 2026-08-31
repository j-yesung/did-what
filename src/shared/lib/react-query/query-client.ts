import { QueryClient } from "@tanstack/react-query";

export const MAIN_QUERY_OPTIONS = {
  gcTime: Number.POSITIVE_INFINITY,
  staleTime: Number.POSITIVE_INFINITY,
} as const;

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
