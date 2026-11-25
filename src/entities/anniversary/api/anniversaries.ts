import type { SupabaseClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";

import { createClient } from "@/shared/api/supabase/client";
import type { Database } from "@/shared/api/supabase/database.types";
import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

import type { Anniversary } from "../model/types";

export const ANNIVERSARIES_QUERY_KEY = ["anniversaries"] as const;

export const fetchAnniversaries = async (client: SupabaseClient<Database>): Promise<Anniversary[]> => {
  const anniversaries: Anniversary[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from("anniversaries")
      .select("id, name, date")
      .order("date")
      .order("id")
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    anniversaries.push(...data);
    if (data.length < pageSize) return anniversaries;
  }
};

export const anniversariesQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: ANNIVERSARIES_QUERY_KEY,
  queryFn: () => fetchAnniversaries(createClient()),
});
