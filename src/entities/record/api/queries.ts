import { createClient } from "@/shared/api/supabase/server";

const LIST_COLUMNS = "id, activity, memo, recorded_at, place:places(name), record_people(person:people(name))";
const DETAIL_COLUMNS =
  "id, activity, memo, place_id, recorded_at, place:places(name, address), record_people(person_id, person:people(name))";

// 지도에 찍을 좌표만 가져온다.
export async function getRecordLocations(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("records")
    .select("id, place:places(latitude, longitude)")
    .eq("owner_id", ownerId);

  return { locations: (data ?? []).map(({ id, place }) => ({ id, ...place })), error };
}

// 최신순 기록 목록.
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
