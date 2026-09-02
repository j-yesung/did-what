import { queryOptions } from "@tanstack/react-query";

import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

import { fetchRecords } from "./fetch-records";

export const recordsQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: ["records"],
  queryFn: fetchRecords,
});
