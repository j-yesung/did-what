import { createClient } from "@/shared/api/supabase/server";

export async function getPlaceRecords(placeId: string, ownerId: string) {
  const supabase = await createClient();

  return supabase
    .from("record_places")
    .select("record:records!inner(id, activity, memo, weather, recorded_at, recorded_until, owner_id)")
    .eq("place_id", placeId)
    .eq("record.owner_id", ownerId);
}
