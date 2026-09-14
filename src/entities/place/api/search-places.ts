import { apiClient } from "@/shared/api/http/axios-instance";
import type { KakaoPlace, KakaoSearchScope } from "@/shared/api/kakao-local";

export type PlaceSearchParams = {
  latitude?: number;
  longitude?: number;
  page?: number;
  query: string;
};

export type PlaceSearchResult = {
  isEnd: boolean;
  page: number;
  pageableCount: number;
  places: KakaoPlace[];
  /** 서버가 실제로 검색한 조건. 고른 장소를 다시 확인할 때 그대로 넘겨야 한다. */
  query: string;
  scope: KakaoSearchScope | null;
};

/** signal은 TanStack Query가 넘겨준다. 검색어가 바뀌어 이전 요청이 필요 없어지면 그대로 취소된다. */
export const searchPlaces = async (
  { latitude, longitude, page = 1, query }: PlaceSearchParams,
  signal?: AbortSignal,
) => {
  const { data } = await apiClient.get<PlaceSearchResult>("/places/search", {
    params: { latitude, longitude, page, query },
    signal,
  });

  return data;
};
