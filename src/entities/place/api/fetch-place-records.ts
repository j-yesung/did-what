import { createClient } from "@/shared/api/supabase/client";

export async function fetchPlaceRecords(placeId: string) {
  const { data, error } = await createClient()
    .from("record_places")
    .select("record:records!inner(id, activity, memo, weather, recorded_at, recorded_until)")
    .eq("place_id", placeId);

  if (error) throw error;
  return data;
}
