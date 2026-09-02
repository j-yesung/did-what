import { useQuery } from "@tanstack/react-query";

import { placeSearchQueryOptions } from "../api/queries";
import type { PlaceSearchParams } from "../api/search-places";

export function usePlaceSearch(params: PlaceSearchParams) {
  return useQuery(placeSearchQueryOptions(params));
}
