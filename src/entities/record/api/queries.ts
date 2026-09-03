import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

import type { RecordFilters } from "../model/record-filters";
import type { RecordCursor } from "../model/record-page";
import { fetchRecordLocations } from "./fetch-record-locations";
import { fetchRecordPage } from "./fetch-record-page";
import { fetchRegionRecords, type RecordRegionFilter } from "./fetch-region-records";

export const RECORDS_QUERY_KEY = ["records"] as const;

export const recordLocationsQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: [...RECORDS_QUERY_KEY, "locations"],
  queryFn: fetchRecordLocations,
});

export function recordListQueryOptions(filters: RecordFilters) {
  return infiniteQueryOptions({
    ...MAIN_QUERY_OPTIONS,
    queryKey: [...RECORDS_QUERY_KEY, "list", filters],
    queryFn: ({ pageParam }) => fetchRecordPage(filters, pageParam),
    initialPageParam: null as RecordCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function regionRecordsQueryOptions(region: RecordRegionFilter) {
  return queryOptions({
    ...MAIN_QUERY_OPTIONS,
    queryKey: [...RECORDS_QUERY_KEY, "region", region.code],
    queryFn: () => fetchRegionRecords(region),
  });
}
