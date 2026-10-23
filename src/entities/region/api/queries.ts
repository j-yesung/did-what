import { queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/shared/api/http/axios-instance";
import type { KakaoRegion } from "@/shared/api/kakao-local";

export type RegionSearchResult = {
  /** 서버가 실제로 검색한 문자열. 고른 지역에 붙일 이름으로 쓴다. */
  query: string;
  /** 입력한 이름으로 못 찾아 주변 지역을 대신 찾아 준 경우 true. */
  related: boolean;
  regions: KakaoRegion[];
};

const searchRegions = async (query: string, signal?: AbortSignal) => {
  const { data } = await apiClient.get<RegionSearchResult>("/regions/search", {
    params: { query },
    signal,
  });

  return data;
};

/** 지역 검색 캐시를 한꺼번에 비울 때 쓰는 접두어. */
const REGION_SEARCH_KEY = ["regions", "search"] as const;

/** 지도 모델(GeoJSON·그리드)과 같은 배럴을 거치지 않도록, 지역 검색은 이 파일에서 바로 가져다 쓴다. */
export const regionSearchQueryOptions = (query: string) => {
  return queryOptions({
    queryKey: [...REGION_SEARCH_KEY, query],
    queryFn: ({ signal }) => searchRegions(query, signal),
    enabled: query.trim().length > 0,
    staleTime: 60_000,
  });
};
