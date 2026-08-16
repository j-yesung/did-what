import { queryOptions } from "@tanstack/react-query";

import { createClient } from "@/shared/api/supabase/client";
import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

const COLUMNS =
  "id, name, address, created_at, saved_at, region_code, provider, provider_place_id, record_places(count)";

async function fetchPlaces() {
  const { data, error } = await createClient().from("places").select(COLUMNS).not("saved_at", "is", null).order("name");

  if (error) throw error;
  return data;
}

export const placesQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: ["places"],
  queryFn: fetchPlaces,
});
