"use client";

import { usePrefetchQuery } from "@tanstack/react-query";

import { placesQueryOptions } from "@/entities/place/api/places-query";
import { recordsQueryOptions } from "@/entities/record/api/records-query";

export function MainDataPrefetch() {
  usePrefetchQuery(recordsQueryOptions);
  usePrefetchQuery(placesQueryOptions);

  return null;
}
