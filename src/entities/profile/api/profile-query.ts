import { queryOptions } from "@tanstack/react-query";

import { createClient } from "@/shared/api/supabase/client";
import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

async function fetchProfileName() {
  const { data, error } = await createClient().from("profiles").select("display_name").maybeSingle();

  if (error) throw error;
  return data?.display_name ?? null;
}

export const profileQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: ["profile"],
  queryFn: fetchProfileName,
});
