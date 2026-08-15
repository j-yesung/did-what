import { useQuery } from "@tanstack/react-query";

import { type PlaceSearchParams, searchPlaces } from "./search-places";

export const PLACE_SEARCH_KEY = ["places", "search"] as const;

export function usePlaceSearch(params: PlaceSearchParams) {
  return useQuery({
    queryKey: [...PLACE_SEARCH_KEY, params],
    queryFn: ({ signal }) => searchPlaces(params, signal),
    enabled: params.query.trim().length > 0,
    staleTime: 60_000,
  });
}
