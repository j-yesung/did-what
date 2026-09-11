import { createClient } from "@/shared/api/supabase/client";

import { PLACE_DETAIL_COLUMNS, SAVED_PLACE_COLUMNS } from "./place-columns";

export const fetchPlace = async (placeId: string) => {
  const { data, error } = await createClient()
    .from("places")
    .select(PLACE_DETAIL_COLUMNS)
    .eq("id", placeId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const fetchPlaceRecords = async (placeId: string) => {
  const { data, error } = await createClient()
    .from("record_places")
    .select("record:records!inner(id, activity, memo, weather, recorded_at, recorded_until)")
    .eq("place_id", placeId);

  if (error) throw error;
  return data;
};

export const fetchPlaces = async () => {
  const { data, error } = await createClient()
    .from("places")
    .select(SAVED_PLACE_COLUMNS)
    .not("saved_at", "is", null)
    .order("name");

  if (error) throw error;
  return data;
};

export type SavedPlaceRow = Awaited<ReturnType<typeof fetchPlaces>>[number];
