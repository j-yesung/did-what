import { createClient } from "@/shared/api/supabase/server";

const COLUMNS =
  "id, activity, memo, weather, recorded_at, recorded_until, created_at, region_code, region_label, region_name, region_latitude, region_longitude";

export async function getRecords(ownerId: string) {
  const supabase = await createClient();

  return supabase
    .from("records")
    .select(COLUMNS)
    .eq("owner_id", ownerId)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false });
}
