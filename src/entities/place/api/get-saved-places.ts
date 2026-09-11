import { createClient } from "@/shared/api/supabase/server";

import { SAVED_PLACE_COLUMNS } from "./place-columns";

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
