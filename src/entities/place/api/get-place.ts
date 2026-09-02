import { createClient } from "@/shared/api/supabase/server";

const COLUMNS = "id, name, address, created_at, saved_at, region_code, region_name, provider, provider_place_id";

export async function getPlace(placeId: string, ownerId: string) {
  const supabase = await createClient();

  return supabase.from("places").select(COLUMNS).eq("id", placeId).eq("owner_id", ownerId).maybeSingle();
}
