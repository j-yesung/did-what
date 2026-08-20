import { createClient } from "@/shared/api/supabase/server";

const COLUMNS = "id, name, address, created_at, saved_at, region_code, provider, provider_place_id";

// 소유자의 장소 한 곳. 없으면 data가 null이다.
export async function getPlace(placeId: string, ownerId: string) {
  const supabase = await createClient();

  return supabase.from("places").select(COLUMNS).eq("id", placeId).eq("owner_id", ownerId).maybeSingle();
}

// 특정 장소가 연결된 소유자의 기록. 최신순.
export async function getPlaceRecords(placeId: string, ownerId: string) {
  const supabase = await createClient();

  return supabase
    .from("record_places")
    .select("record:records!inner(id, activity, memo, recorded_at, recorded_until, owner_id)")
    .eq("place_id", placeId)
    .eq("record.owner_id", ownerId);
}

// 소유자의 장소 하나. 존재 검증용.
export async function findPlace(placeId: string, ownerId: string) {
  const supabase = await createClient();

  return supabase.from("places").select("id").eq("id", placeId).eq("owner_id", ownerId).maybeSingle();
}
