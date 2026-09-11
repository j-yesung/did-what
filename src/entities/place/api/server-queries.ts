import { createClient } from "@/shared/api/supabase/server";

import { SAVED_PLACE_COLUMNS } from "./place-columns";

export const findPlace = async (placeId: string, ownerId: string) => {
  const supabase = await createClient();

  return supabase.from("places").select("id").eq("id", placeId).eq("owner_id", ownerId).maybeSingle();
};

export const getSavedPlaces = async (ownerId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(SAVED_PLACE_COLUMNS)
    .eq("owner_id", ownerId)
    .not("saved_at", "is", null)
    .order("name");

  if (error) throw error;
  return data;
};
