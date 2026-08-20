import { createClient } from "@/shared/api/supabase/server";

// 소유자의 사람 한 명. 없으면 data가 null이다.
export async function getPerson(personId: string, ownerId: string) {
  const supabase = await createClient();

  return supabase
    .from("people")
    .select("id, name, created_at")
    .eq("id", personId)
    .eq("owner_id", ownerId)
    .maybeSingle();
}

// 특정 사람과 함께한 소유자의 기록. 최신순.
export async function getPersonRecords(personId: string, ownerId: string) {
  const supabase = await createClient();

  return supabase
    .from("records")
    .select(
      "id, activity, memo, recorded_at, recorded_until, region_label, region_name, record_people!inner(person_id)",
    )
    .eq("owner_id", ownerId)
    .eq("record_people.person_id", personId)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false });
}

// 넘긴 id 중 소유자의 것만 돌려준다. 존재 검증용.
export async function findPersonIds(personIds: string[], ownerId: string) {
  const supabase = await createClient();

  return supabase.from("people").select("id").in("id", personIds).eq("owner_id", ownerId);
}
