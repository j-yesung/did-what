import { apiClient } from "@/shared/api/http/axios-instance";
import type { KakaoRegion } from "@/shared/api/kakao-local";

export type RegionSearchResult = {
  /** 서버가 실제로 검색한 문자열. 고른 지역에 붙일 이름으로 쓴다. */
  query: string;
  /** 입력한 이름으로 못 찾아 주변 지역을 대신 찾아 준 경우 true. */
  related: boolean;
  regions: KakaoRegion[];
};

export async function searchRegions(query: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<RegionSearchResult>("/regions/search", {
    params: { query },
    signal,
  });

  return data;
}
