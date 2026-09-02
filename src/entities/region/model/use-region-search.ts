"use client";

import { useQuery } from "@tanstack/react-query";

import { regionSearchQueryOptions } from "../api/queries";

export function useRegionSearch(query: string) {
  return useQuery(regionSearchQueryOptions(query));
}
