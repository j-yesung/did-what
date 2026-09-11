import { createClient } from "@/shared/api/supabase/server";

import { RECORD_LOCATION_COLUMNS } from "./record-columns";

export const getRecordLocations = async (ownerId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("records")
    .select(RECORD_LOCATION_COLUMNS)
    .eq("owner_id", ownerId)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
};
