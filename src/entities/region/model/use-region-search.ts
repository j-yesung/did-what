"use client";

import { useQuery } from "@tanstack/react-query";

import { regionSearchQueryOptions } from "../api/queries";

export const useRegionSearch = (query: string) => {
  return useQuery(regionSearchQueryOptions(query));
};
