import { createClient } from "@/shared/api/supabase/client";

export async function fetchRecordPlaces(recordId: string) {
  const { data, error } = await createClient()
    .from("records")
    .select("id, record_places(place:places(id, name, address, saved_at))")
    .eq("id", recordId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
