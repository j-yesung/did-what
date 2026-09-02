import { createClient } from "@/shared/api/supabase/server";

export async function findPlace(placeId: string, ownerId: string) {
  const supabase = await createClient();

  return supabase.from("places").select("id").eq("id", placeId).eq("owner_id", ownerId).maybeSingle();
}
