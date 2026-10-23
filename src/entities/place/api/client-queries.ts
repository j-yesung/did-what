import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/shared/api/supabase/client";
import type { Database } from "@/shared/api/supabase/database.types";

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
    .select("record:records!inner(id, activity, category, memo, weather, recorded_at, recorded_until)")
    .eq("place_id", placeId);

  if (error) throw error;
  return data;
};

// 서버 화면이 첫 화면에 쓸 목록을 미리 받을 수 있게 클라이언트를 받는다.
export const fetchPlaces = async (client: SupabaseClient<Database>) => {
  const { data, error } = await client
    .from("places")
    .select(SAVED_PLACE_COLUMNS)
    .not("saved_at", "is", null)
    .order("saved_at", { ascending: false })
    .order("name");

  if (error) throw error;
  return data;
};

export type SavedPlaceRow = Awaited<ReturnType<typeof fetchPlaces>>[number];
