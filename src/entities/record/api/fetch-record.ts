import { createClient } from "@/shared/api/supabase/client";

import { RECORD_DETAIL_COLUMNS } from "./record-columns";

export const fetchRecord = async (recordId: string) => {
  const { data, error } = await createClient()
    .from("records")
    .select(RECORD_DETAIL_COLUMNS)
    .eq("id", recordId)
    .maybeSingle();

  if (error) throw error;
  return data;
};
