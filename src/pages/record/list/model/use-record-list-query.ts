"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { type RecordFilters, recordListQueryOptions } from "@/entities/record";

import { reverseRecordPages } from "./record-list-cache";

export function useRecordListQuery(filters: RecordFilters) {
  const queryClient = useQueryClient();
  const alternateSort = filters.sort === "recent" ? "oldest" : "recent";
  const alternateQueryOptions = recordListQueryOptions({ ...filters, sort: alternateSort });
  const alternateQuery = queryClient.getQueryData(alternateQueryOptions.queryKey);
  const alternateQueryState = queryClient.getQueryState(alternateQueryOptions.queryKey);
  const completeAlternateData =
    alternateQuery && alternateQueryState?.isInvalidated !== true && alternateQuery.pages.at(-1)?.nextCursor === null
      ? reverseRecordPages(alternateQuery.pages)
      : undefined;

  return useInfiniteQuery({
    ...recordListQueryOptions(filters),
    ...(completeAlternateData ? { initialData: completeAlternateData } : {}),
  });
}
