import { createClient } from "@/shared/api/supabase/client";

export const fetchRecordPlaces = async (recordId: string) => {
  const { data, error } = await createClient()
    .from("records")
    .select("id, record_places(place:places(id, name, address, saved_at))")
    .eq("id", recordId)
    .maybeSingle();

  if (error) throw error;
  return data;
};
