"use client";

import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { placesQueryOptions } from "@/entities/place";
import { recordsQueryOptions } from "@/entities/record";
import { pushEndpointQueryOptions } from "@/features/push-notification";

export function MainDataPrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.prefetchQuery(recordsQueryOptions);
    void queryClient.prefetchQuery(placesQueryOptions);
    void queryClient.prefetchQuery(pushEndpointQueryOptions);
  }, [queryClient]);

  return null;
}
