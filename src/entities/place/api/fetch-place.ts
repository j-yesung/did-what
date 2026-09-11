import { createClient } from "@/shared/api/supabase/client";

import { PLACE_DETAIL_COLUMNS } from "./place-columns";

export const fetchPlace = async (placeId: string) => {
  const { data, error } = await createClient()
    .from("places")
    .select(PLACE_DETAIL_COLUMNS)
    .eq("id", placeId)
    .maybeSingle();

  if (error) throw error;
  return data;
};
