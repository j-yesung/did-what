import { createClient } from "@/shared/api/supabase/server";

import { RECORD_DETAIL_COLUMNS } from "./record-columns";

export const getRecord = async (recordId: string, ownerId: string) => {
  const supabase = await createClient();

  return supabase
    .from("records")
    .select(RECORD_DETAIL_COLUMNS)
    .eq("id", recordId)
    .eq("owner_id", ownerId)
    .maybeSingle();
};
