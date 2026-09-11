import { queryOptions } from "@tanstack/react-query";

import { searchRegions } from "./search-regions";

/** 지역 검색 캐시를 한꺼번에 비울 때 쓰는 접두어. */
const REGION_SEARCH_KEY = ["regions", "search"] as const;

export function regionSearchQueryOptions(query: string) {
  return queryOptions({
    queryKey: [...REGION_SEARCH_KEY, query],
    queryFn: ({ signal }) => searchRegions(query, signal),
    enabled: query.trim().length > 0,
    staleTime: 60_000,
  });
}
