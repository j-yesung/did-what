import type { SupabaseClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";

import { RECORDS_QUERY_KEY } from "@/entities/record";
import { createClient } from "@/shared/api/supabase/client";
import type { Database } from "@/shared/api/supabase/database.types";
import { getToday } from "@/shared/lib/date/get-today";
import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

import type { HomeRecord } from "../model/retrospect";

const PAGE_SIZE = 500;

export const fetchHomeData = async (client: SupabaseClient<Database>) => {
  const records: HomeRecord[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from("records")
      .select(
        "id, activity, category, recorded_at, recorded_until, region_code, region_label, region_name, record_regions(region_code, region_name, region_label, region_latitude, region_longitude), record_places(place:places(id, name, latitude, longitude)), record_comments(count)",
      )
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    records.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return { records, today: getToday() };
};

export const homeQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: [...RECORDS_QUERY_KEY, "home"],
  queryFn: () => fetchHomeData(createClient()),
});
