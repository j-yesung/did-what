import { createClient } from "@/shared/api/supabase/client";

const COLUMNS =
  "id, name, address, created_at, saved_at, region_code, region_name, provider, provider_place_id, record_places(count)";

export async function fetchPlaces() {
  const { data, error } = await createClient().from("places").select(COLUMNS).not("saved_at", "is", null).order("name");

  if (error) throw error;
  return data;
}
