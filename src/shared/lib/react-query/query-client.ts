import { QueryClient } from "@tanstack/react-query";

export const MAIN_QUERY_OPTIONS = {
  refetchOnWindowFocus: true,
  staleTime: 60_000,
} as const;

export const createQueryClient = () => {
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
};
