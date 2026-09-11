import { createClient } from "@/shared/api/supabase/server";

export const findPlace = async (placeId: string, ownerId: string) => {
  const supabase = await createClient();

  return supabase.from("places").select("id").eq("id", placeId).eq("owner_id", ownerId).maybeSingle();
};
