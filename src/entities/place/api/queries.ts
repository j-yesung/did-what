import { queryOptions } from "@tanstack/react-query";

import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

import { fetchPlace } from "./fetch-place";
import { fetchPlaceRecords } from "./fetch-place-records";
import { fetchPlaces } from "./fetch-places";
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

export const placeSearchQueryOptions = (params: PlaceSearchParams) => {
  return queryOptions({
    enabled: params.query.trim().length > 0,
    queryFn: ({ signal }) => searchPlaces(params, signal),
    queryKey: [...PLACE_SEARCH_KEY, params],
    staleTime: 60_000,
  });
};
