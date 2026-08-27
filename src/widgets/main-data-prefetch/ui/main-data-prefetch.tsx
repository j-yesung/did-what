"use client";

import { usePrefetchQuery } from "@tanstack/react-query";

import { placesQueryOptions } from "@/entities/place/api/places-query";
import { recordsQueryOptions } from "@/entities/record/api/records-query";
import { pushEndpointQueryOptions } from "@/features/push-notification";

export function MainDataPrefetch() {
  usePrefetchQuery(recordsQueryOptions);
  usePrefetchQuery(placesQueryOptions);
  usePrefetchQuery(pushEndpointQueryOptions);

  return null;
}
