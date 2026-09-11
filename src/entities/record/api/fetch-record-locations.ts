import { createClient } from "@/shared/api/supabase/client";

import { RECORD_LOCATION_COLUMNS } from "./record-columns";

export async function fetchRecordLocations() {
  const { data, error } = await createClient()
    .from("records")
    .select(RECORD_LOCATION_COLUMNS)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
}
