import { createClient } from "@/shared/api/supabase/client";

import { SAVED_PLACE_COLUMNS } from "./place-columns";

export async function fetchPlaces() {
  const { data, error } = await createClient()
    .from("places")
    .select(SAVED_PLACE_COLUMNS)
    .not("saved_at", "is", null)
    .order("name");

  if (error) throw error;
  return data;
}

export type SavedPlaceRow = Awaited<ReturnType<typeof fetchPlaces>>[number];
