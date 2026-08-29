import { createClient } from "@/shared/api/supabase/server";

const DETAIL_COLUMNS =
  "id, activity, memo, weather, recorded_at, recorded_until, region_code, region_label, region_name, region_latitude, region_longitude, record_places(place:places(id, name, address, saved_at))";
const LIST_COLUMNS =
  "id, activity, memo, weather, recorded_at, recorded_until, created_at, region_code, region_label, region_name, region_latitude, region_longitude";

// 소유자의 전체 기록. 최신순.
export async function getRecords(ownerId: string) {
  const supabase = await createClient();

  return supabase
    .from("records")
    .select(LIST_COLUMNS)
    .eq("owner_id", ownerId)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false });
}

// 소유자의 기록 하나. 없으면 data가 null이다.
export async function getRecord(recordId: string, ownerId: string) {
  const supabase = await createClient();

  return supabase.from("records").select(DETAIL_COLUMNS).eq("id", recordId).eq("owner_id", ownerId).maybeSingle();
}
