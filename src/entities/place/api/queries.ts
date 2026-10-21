import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { KAKAO_SEARCH_MAX_PAGE } from "@/shared/api/kakao-local";
import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

import { fetchPlace, fetchPlaceRecords, fetchPlaces } from "./client-queries";
import { type PlaceSearchParams, searchPlaces } from "./search-places";

const PLACES_QUERY_KEY = ["places"] as const;
const PLACE_SEARCH_KEY = ["places", "search"] as const;

export const placesQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: PLACES_QUERY_KEY,
  queryFn: fetchPlaces,
});

export const placeQueryKey = (placeId: string) => {
  return [...PLACES_QUERY_KEY, "detail", placeId] as const;
};

export const placeQueryOptions = (placeId: string) => {
  return queryOptions({
    ...MAIN_QUERY_OPTIONS,
    queryKey: placeQueryKey(placeId),
    queryFn: () => fetchPlace(placeId),
  });
};

export const placeRecordsQueryOptions = (placeId: string) => {
  return queryOptions({
    ...MAIN_QUERY_OPTIONS,
    queryKey: [...PLACES_QUERY_KEY, "records", placeId],
    queryFn: () => fetchPlaceRecords(placeId),
  });
};

export const placeSearchInfiniteQueryOptions = (params: Omit<PlaceSearchParams, "page">) => {
  return infiniteQueryOptions({
    enabled: params.query.trim().length > 0 && params.query.length <= 100,
    queryFn: ({ pageParam, signal }) => searchPlaces({ ...params, page: pageParam }, signal),
    queryKey: [...PLACE_SEARCH_KEY, params, "infinite"],
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.isEnd || lastPage.page >= KAKAO_SEARCH_MAX_PAGE ? undefined : lastPage.page + 1,
    staleTime: 60_000,
  });
};
