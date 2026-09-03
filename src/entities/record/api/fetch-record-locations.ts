import { createClient } from "@/shared/api/supabase/client";

const COLUMNS =
  "id, recorded_at, created_at, region_code, region_label, region_name, region_latitude, region_longitude";

export async function fetchRecordLocations() {
  const { data, error } = await createClient()
    .from("records")
    .select(COLUMNS)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
}

export type RecordLocationRow = Awaited<ReturnType<typeof fetchRecordLocations>>[number];
