import { createClient } from "@/shared/api/supabase/server";

const COLUMNS = "id, name, created_at";

export type PersonOption = {
  id: string;
  name: string;
};

/** 소유자의 사람 목록. 이름순. */
export async function getPeople(ownerId: string) {
  const supabase = await createClient();

  return supabase.from("people").select(COLUMNS).eq("owner_id", ownerId).order("name");
}

/** 넘긴 id 중 소유자의 것만 돌려준다. 존재 검증용. */
export async function findPersonIds(personIds: string[], ownerId: string) {
  const supabase = await createClient();

  return supabase.from("people").select("id").in("id", personIds).eq("owner_id", ownerId);
}
