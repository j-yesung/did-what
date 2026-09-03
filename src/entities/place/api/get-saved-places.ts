import { createClient } from "@/shared/api/supabase/server";

const COLUMNS =
  "id, name, address, created_at, saved_at, region_code, region_name, provider, provider_place_id, record_places(count)";

export async function getSavedPlaces(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(COLUMNS)
    .eq("owner_id", ownerId)
    .not("saved_at", "is", null)
    .order("name");

  if (error) throw error;
  return data;
}
