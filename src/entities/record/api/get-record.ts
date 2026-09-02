import { createClient } from "@/shared/api/supabase/server";

const COLUMNS =
  "id, activity, memo, weather, recorded_at, recorded_until, region_code, region_label, region_name, region_latitude, region_longitude, record_places(place:places(id, name, address, saved_at))";

export async function getRecord(recordId: string, ownerId: string) {
  const supabase = await createClient();

  return supabase.from("records").select(COLUMNS).eq("id", recordId).eq("owner_id", ownerId).maybeSingle();
}
