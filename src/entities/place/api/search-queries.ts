import { useQuery } from "@tanstack/react-query";

import { type PlaceSearchParams, searchPlaces } from "./search-places";

const MIN_QUERY_LENGTH = 2;

export const PLACE_SEARCH_KEY = ["places", "search"] as const;

export function usePlaceSearch(params: PlaceSearchParams) {
  return useQuery({
    queryKey: [...PLACE_SEARCH_KEY, params],
    queryFn: ({ signal }) => searchPlaces(params, signal),
    enabled: params.query.trim().length >= MIN_QUERY_LENGTH,
    staleTime: 60_000,
  });
}
