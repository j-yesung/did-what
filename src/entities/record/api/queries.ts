import { infiniteQueryOptions, keepPreviousData, queryOptions } from "@tanstack/react-query";

import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

import type { RecordFilters } from "../model/record-filters";
import type { RecordCursor } from "../model/record-page";
import {
  fetchRecord,
  fetchRecordLocations,
  fetchRecordMonthBounds,
  fetchRecordPage,
  fetchRecordPlaces,
  fetchRecordsInPeriod,
  fetchRegionRecords,
  type RecordRegionFilter,
} from "./client-queries";

export const RECORDS_QUERY_KEY = ["records"] as const;
export const RECORD_DETAILS_QUERY_KEY = [...RECORDS_QUERY_KEY, "detail"] as const;

export const recordSummaryQueryKey = (recordId: string) => {
  return [...RECORDS_QUERY_KEY, "summary", recordId] as const;
};

export const recordDetailQueryOptions = (recordId: string) => {
  return queryOptions({
    ...MAIN_QUERY_OPTIONS,
    queryKey: [...RECORD_DETAILS_QUERY_KEY, recordId],
    queryFn: () => fetchRecord(recordId),
  });
};

export const recordPlacesQueryOptions = (recordId: string) => {
  return queryOptions({
    ...MAIN_QUERY_OPTIONS,
    queryKey: [...RECORD_DETAILS_QUERY_KEY, recordId, "places"],
    queryFn: () => fetchRecordPlaces(recordId),
  });
};

export const recordLocationsQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: [...RECORDS_QUERY_KEY, "locations"],
  queryFn: fetchRecordLocations,
});

export const recordMonthBoundsQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: [...RECORDS_QUERY_KEY, "month-bounds"],
  queryFn: fetchRecordMonthBounds,
});

export const recordListQueryOptions = (filters: RecordFilters) => {
  return infiniteQueryOptions({
    ...MAIN_QUERY_OPTIONS,
    queryKey: [...RECORDS_QUERY_KEY, "list", filters],
    queryFn: ({ pageParam }) => fetchRecordPage(filters, pageParam),
    initialPageParam: null as RecordCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });
};

export const recordCalendarQueryOptions = (period: Pick<RecordFilters, "from" | "to">) => {
  return queryOptions({
    ...MAIN_QUERY_OPTIONS,
    queryKey: [...RECORDS_QUERY_KEY, "calendar", period],
    queryFn: () => fetchRecordsInPeriod(period),
  });
};

export const regionRecordsQueryOptions = (region: RecordRegionFilter) => {
  return queryOptions({
    ...MAIN_QUERY_OPTIONS,
    queryKey: [...RECORDS_QUERY_KEY, "region", region.code],
    queryFn: () => fetchRegionRecords(region),
  });
};
