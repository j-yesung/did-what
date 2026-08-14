import { useQuery } from "@tanstack/react-query";

import { searchRegions } from "./search-regions";

const MIN_QUERY_LENGTH = 2;

/** 지역 검색 캐시를 한꺼번에 비울 때 쓰는 접두어. */
export const REGION_SEARCH_KEY = ["regions", "search"] as const;

export function useRegionSearch(query: string) {
  return useQuery({
    queryKey: [...REGION_SEARCH_KEY, query],
    queryFn: ({ signal }) => searchRegions(query, signal),
    enabled: query.trim().length >= MIN_QUERY_LENGTH,
    staleTime: 60_000,
  });
}
