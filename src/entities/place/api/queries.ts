import { createClient } from "@/shared/api/supabase/server";

const COLUMNS = "id, name, address, created_at, provider, provider_place_id";

// 소유자의 장소 목록. 이름순.
export async function getPlaces(ownerId: string) {
  const supabase = await createClient();

  return supabase.from("places").select(COLUMNS).eq("owner_id", ownerId).order("name");
}

// 소유자의 장소 하나. 존재 검증용.
export async function findPlace(placeId: string, ownerId: string) {
  const supabase = await createClient();

  return supabase.from("places").select("id").eq("id", placeId).eq("owner_id", ownerId).maybeSingle();
}
