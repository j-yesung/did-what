import { apiClient } from "@/shared/api/http/axios-instance";
import type { KakaoPlace } from "@/shared/api/kakao-local";

export type PlaceSearchParams = {
  page?: number;
  query: string;
  regionName?: string;
};

export type PlaceSearchResult = {
  isEnd: boolean;
  page: number;
  pageableCount: number;
  places: KakaoPlace[];
  /** 서버가 실제로 검색한 문자열. 고른 장소를 다시 확인할 때 그대로 넘겨야 한다. */
  query: string;
};

/** signal은 TanStack Query가 넘겨준다. 검색어가 바뀌어 이전 요청이 필요 없어지면 그대로 취소된다. */
export async function searchPlaces({ page = 1, query, regionName }: PlaceSearchParams, signal?: AbortSignal) {
  const { data } = await apiClient.get<PlaceSearchResult>("/places/search", {
    params: { page, query, regionName },
    signal,
  });

  return data;
}
