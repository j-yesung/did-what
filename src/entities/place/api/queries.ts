import { queryOptions } from "@tanstack/react-query";

import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

import { fetchPlaces } from "./fetch-places";
import { type PlaceSearchParams, searchPlaces } from "./search-places";

export const PLACE_SEARCH_KEY = ["places", "search"] as const;

export const placesQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: ["places"],
  queryFn: fetchPlaces,
});

export function placeSearchQueryOptions(params: PlaceSearchParams) {
  return queryOptions({
    enabled: params.query.trim().length > 0,
    queryFn: ({ signal }) => searchPlaces(params, signal),
    queryKey: [...PLACE_SEARCH_KEY, params],
    staleTime: 60_000,
  });
}
