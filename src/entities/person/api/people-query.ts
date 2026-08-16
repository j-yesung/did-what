import { queryOptions } from "@tanstack/react-query";

import { createClient } from "@/shared/api/supabase/client";
import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

async function fetchPeople() {
  const { data, error } = await createClient().from("people").select("id, name, created_at").order("name");

  if (error) throw error;
  return data;
}

export const peopleQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: ["people"],
  queryFn: fetchPeople,
});
