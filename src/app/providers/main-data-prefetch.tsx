"use client";

import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { parseRecordFilters, recordListQueryOptions } from "@/entities/record";
import { pushEndpointQueryOptions } from "@/features/push-notification";

export function MainDataPrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.prefetchInfiniteQuery(recordListQueryOptions(parseRecordFilters({})));
    void queryClient.prefetchQuery(pushEndpointQueryOptions);
  }, [queryClient]);

  return null;
}
