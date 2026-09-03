import { createClient } from "@/shared/api/supabase/server";

const COLUMNS =
  "id, recorded_at, created_at, region_code, region_label, region_name, region_latitude, region_longitude";

export async function getRecordLocations(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("records")
    .select(COLUMNS)
    .eq("owner_id", ownerId)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
}
