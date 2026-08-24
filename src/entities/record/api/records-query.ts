import { queryOptions } from "@tanstack/react-query";

import { createClient } from "@/shared/api/supabase/client";
import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

const COLUMNS =
  "id, activity, memo, weather, recorded_at, recorded_until, created_at, region_code, region_label, region_name, region_latitude, region_longitude";

async function fetchRecords() {
  const { data, error } = await createClient()
    .from("records")
    .select(COLUMNS)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export const recordsQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: ["records"],
  queryFn: fetchRecords,
});
